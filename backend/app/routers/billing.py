import logging
from fastapi import APIRouter, Depends, Request, HTTPException, Header
from sqlalchemy.orm import Session
from uuid import UUID
import json
import uuid
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.database import get_db
from app.config import settings
from app.models import BillingWebhookEvent, Subscription, SubscriptionHistory, AuditLog, Business
from app.services.billing.provider_interface import get_billing_provider
from app.services.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/billing", tags=["Billing"])

@router.post("/webhook/{provider_name}")
async def receive_billing_webhook(
    provider_name: str,
    request: Request,
    x_razorpay_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Receives webhooks from billing providers (Razorpay, Stripe), verifies signature,
    and logs them to BillingWebhookEvent for idempotency and asynchronous processing.
    """
    payload_bytes = await request.body()
    payload_str = payload_bytes.decode("utf-8")
    
    try:
        payload_dict = json.loads(payload_str)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    try:
        provider = get_billing_provider(provider_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 1. Signature Verification
    # Currently hardcoded for razorpay header. A real implementation would map headers.
    signature = x_razorpay_signature
    secret = settings.RAZORPAY_WEBHOOK_SECRET if hasattr(settings, 'RAZORPAY_WEBHOOK_SECRET') else "secret"
    
    if not provider.verify_webhook_signature(payload_str, signature, secret):
        logger.warning(f"Invalid webhook signature from provider: {provider_name}")
        raise HTTPException(status_code=403, detail="Invalid signature")

    # 2. Parse basic details
    event_type, business_id_str = provider.parse_webhook_event(payload_dict)
    
    # Check idempotency
    event_id = payload_dict.get("id") or str(uuid.uuid4()) # Ideally provider event ID
    # In a full implementation, you'd check if this exact provider event ID was already processed.

    # 3. Store in DB
    webhook_event = BillingWebhookEvent(
        provider=provider_name,
        event_type=event_type,
        payload=payload_dict,
        status="pending"
    )
    db.add(webhook_event)
    db.commit()
    db.refresh(webhook_event)

    # 4. Synchronous Processing (For MVP, we process immediately. In scale, use a worker queue)
    if business_id_str:
        try:
            business_uuid = UUID(business_id_str)
            sub = db.query(Subscription).filter(Subscription.business_id == business_uuid).first()
            
            if sub:
                # Naive handling example
                if event_type == "subscription.charged" or event_type == "payment.captured":
                    sub.status = "active"
                    sub.subscription_status_reason = "payment_successful"
                    webhook_event.status = "processed"
                    
                    audit = AuditLog(
                        business_id=business_uuid,
                        action="payment_processed",
                        entity_type="subscription",
                        entity_id=str(sub.id),
                        details={"event": event_type}
                    )
                    db.add(audit)
                    
                elif event_type == "subscription.halted" or event_type == "payment.failed":
                    sub.status = "past_due"
                    sub.subscription_status_reason = "payment_failed"
                    webhook_event.status = "processed"
                    
                webhook_event.processed_at = datetime.utcnow()
                db.commit()
        except Exception as e:
            db.rollback()
            webhook_event.status = "failed"
            webhook_event.error_message = str(e)
            db.commit()
            logger.error(f"Error processing webhook event: {e}")

    return {"status": "success"}

@router.get("/subscription/{business_id}")
def get_subscription_status(
    business_id: UUID,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve subscription and trial status for a business."""
    if current_user.business_id != business_id:
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    sub = db.query(Subscription).filter(Subscription.business_id == business_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")
        
    # Calculate remaining trial days
    trial_days_left = 0
    if sub.plan_type == "TRIAL" and sub.trial_end_date:
        trial_end = sub.trial_end_date
        now = datetime.utcnow()
        if trial_end.tzinfo:
            from datetime import timezone
            now = datetime.now(timezone.utc).astimezone(trial_end.tzinfo)
        delta = (trial_end - now).days
        trial_days_left = max(0, delta)
        
    return {
        "plan_type": sub.plan_type,
        "status": sub.status,
        "trial_end_date": sub.trial_end_date,
        "trial_days_left": trial_days_left,
        "subscription_end_date": sub.subscription_end_date
    }

class UpgradeRequest(BaseModel):
    plan_type: str

@router.post("/upgrade")
def upgrade_subscription(
    payload: UpgradeRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Simulates checking out and upgrading the business's subscription.
    """
    plan = payload.plan_type.upper().strip()
    if plan not in ["STARTER", "GROWTH", "ENTERPRISE"]:
        raise HTTPException(status_code=400, detail="Invalid plan type.")
        
    sub = db.query(Subscription).filter(Subscription.business_id == current_user.business_id).first()
    if not sub:
        sub = Subscription(
            business_id=current_user.business_id,
            plan_type="TRIAL",
            status="active"
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)
        
    old_plan = sub.plan_type
    
    # Update subscription to active paid plan
    sub.plan_type = plan
    sub.status = "active"
    sub.subscription_status_reason = "paid"
    sub.trial_end_date = None # Clear trial dates if they exist
    sub.trial_start_date = None
    
    now = datetime.utcnow()
    sub.subscription_start_date = now
    sub.subscription_end_date = now + timedelta(days=30)
    
    # Record subscription history
    amount = 999.00 if plan == "STARTER" else (2999.00 if plan == "GROWTH" else 0.00)
    history = SubscriptionHistory(
        business_id=current_user.business_id,
        old_plan=old_plan,
        new_plan=plan,
        status_change="upgraded",
        amount=amount,
        provider="simulated_checkout",
        timestamp=now
    )
    
    # Record Audit Log
    audit = AuditLog(
        business_id=current_user.business_id,
        action="subscription_upgraded",
        entity_type="subscription",
        entity_id=str(sub.id),
        details={"old_plan": old_plan, "new_plan": plan, "amount": amount}
    )
    
    db.add(history)
    db.add(audit)
    db.commit()
    db.refresh(sub)
    
    return {
        "status": "success",
        "plan_type": sub.plan_type,
        "subscription_status": sub.status,
        "subscription_end_date": sub.subscription_end_date
    }
