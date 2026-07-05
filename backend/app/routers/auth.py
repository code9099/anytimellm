import logging
import asyncio
import jwt
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload, selectinload
from uuid import UUID
from typing import List
from datetime import datetime

from sqlalchemy import func
from app.database import get_db
from app.models import Business, Catalog, Order, Conversation, Message, Document
from app.schemas import BusinessCreate, BusinessOut, CatalogCreate, CatalogOut, OrderOut, ConversationOut, MessageOut, MessageCreate, PaginatedCatalog, PaginatedOrder, PaginatedConversation, InitiateChatRequest
from app.services.security import get_current_user
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/businesses", tags=["Businesses & Tenant Settings"])

@router.post("", response_model=BusinessOut, status_code=status.HTTP_201_CREATED)
def register_business(payload: BusinessCreate, db: Session = Depends(get_db)):
    """Registers a new business tenant on the platform, providing them an isolated namespace and DB context."""
    try:
        new_biz = Business(
            name=payload.name,
            api_settings={
                "system_prompt": f"You are a helpful virtual assistant for {payload.name}. You can answer customer questions about our products, check availability in our database, or help place an order."
            }
        )
        db.add(new_biz)
        db.commit()
        db.refresh(new_biz)
        return new_biz
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating business: {e}")
        raise HTTPException(status_code=500, detail="Internal server error registering business.")


@router.get("/{business_id}", response_model=BusinessOut)
def get_business_details(
    business_id: UUID,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch details and current configuration settings for a business."""
    if current_user.business_id != business_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this business.")
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found.")
    return biz

@router.get("/{business_id}/stats")
def get_business_stats(
    business_id: UUID,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch real database aggregates and metrics for the dashboard overview tab."""
    if current_user.business_id != business_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this business.")
        
    unread_conversations = (
        db.query(func.count(Conversation.id))
        .filter(
            Conversation.business_id == business_id,
            Conversation.status == "active",
            Conversation.is_ai_paused == True
        )
        .scalar() or 0
    )
    
    pending_orders = (
        db.query(func.count(Order.id))
        .filter(Order.business_id == business_id, Order.status == "pending")
        .scalar() or 0
    )
    
    failed_responses = (
        db.query(func.count(Document.id))
        .filter(Document.business_id == business_id, Document.status == "failed")
        .scalar() or 0
    )
    
    from datetime import datetime, timedelta
    cutoff_24h = datetime.utcnow() - timedelta(hours=24)
    active_convs = db.query(Conversation).filter(Conversation.business_id == business_id, Conversation.status == "active").all()
    followups_due = 0
    for conv in active_convs:
        has_cust_msg = db.query(Message).filter(Message.conversation_id == conv.id, Message.sender == "customer").first() is not None
        if not has_cust_msg:
            continue
        has_recent_agent = db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.sender == "agent",
            Message.created_at >= cutoff_24h
        ).first() is not None
        if not has_recent_agent:
            followups_due += 1
            
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    confirmed_orders_today = db.query(Order).filter(
        Order.business_id == business_id,
        Order.status == "confirmed",
        Order.created_at >= today_start
    ).all()
    revenue_today = 0.0
    for order in confirmed_orders_today:
        details = order.details or {}
        items = details.get("items", [])
        if isinstance(items, list):
            for item in items:
                if isinstance(item, dict):
                    price = item.get("price") or item.get("price_per_unit") or item.get("amount")
                    qty = item.get("quantity") or item.get("qty") or 1
                    if price is not None:
                        try:
                            revenue_today += float(price) * float(qty)
                        except (ValueError, TypeError):
                            pass
                    else:
                        item_name = item.get("name") or item.get("item") or item.get("product")
                        if item_name:
                            catalog_item = db.query(Catalog).filter(
                                Catalog.business_id == business_id,
                                Catalog.name == item_name
                            ).first()
                            if catalog_item and catalog_item.price:
                                try:
                                    revenue_today += float(catalog_item.price) * float(qty)
                                except (ValueError, TypeError):
                                    pass
                                    
    orders_count = (
        db.query(func.count(Order.id))
        .filter(Order.business_id == business_id)
        .scalar() or 0
    )
    
    chats_count = (
        db.query(func.count(Conversation.id))
        .filter(Conversation.business_id == business_id, Conversation.status == "active")
        .scalar() or 0
    )
    
    total_closed = db.query(func.count(Conversation.id)).filter(Conversation.business_id == business_id, Conversation.status == "closed").scalar() or 0
    autonomous_closed = db.query(func.count(Conversation.id)).filter(
        Conversation.business_id == business_id,
        Conversation.status == "closed",
        Conversation.is_ai_paused == False
    ).scalar() or 0
    ai_resolution_rate = 100.0
    if total_closed > 0:
        ai_resolution_rate = round((autonomous_closed / total_closed) * 100.0, 1)
        
    return {
        "unread_conversations": unread_conversations,
        "pending_orders": pending_orders,
        "failed_responses": failed_responses,
        "followups_due": followups_due,
        "revenue_today": revenue_today,
        "orders_count": orders_count,
        "chats_count": chats_count,
        "ai_resolution_rate": ai_resolution_rate
    }


@router.patch("/{business_id}/settings", response_model=BusinessOut)
def update_business_settings(
    business_id: UUID,
    payload: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update custom API settings (system prompt, model, temperature, etc.) for a business."""
    if current_user.business_id != business_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this business.")
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found.")
    
    try:
        # Handle direct business field updates
        if "name" in payload:
            name_val = payload.pop("name")
            if not name_val or not name_val.strip():
                raise ValueError("Business name cannot be empty.")
            biz.name = name_val.strip()
        if "onboarding_status" in payload:
            biz.onboarding_status = payload.pop("onboarding_status")
        if "business_type" in payload:
            biz.business_type = payload.pop("business_type")
        
        # Handle API settings updates
        if payload:  # If there are remaining fields to update in api_settings
            settings_data = dict(biz.api_settings or {})
            for k, v in payload.items():
                settings_data[k] = v
            biz.api_settings = settings_data
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(biz, "api_settings")
        
        db.commit()
        db.refresh(biz)
        return biz
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating settings: {e}")
        raise HTTPException(status_code=500, detail="Could not update business settings.")



@router.post("/{business_id}/catalog", response_model=CatalogOut, status_code=status.HTTP_201_CREATED)
def add_catalog_item(
    business_id: UUID,
    payload: CatalogCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a menu item, subscription, or catalog asset to the business's relational data store."""
    if current_user.business_id != business_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this business.")
    # Verify business exists
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found.")
        
    try:
        item = Catalog(
            business_id=business_id,
            category=payload.category,
            name=payload.name,
            description=payload.description,
            price=payload.price,
            attributes=payload.attributes,
            is_available=payload.is_available
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding catalog item: {e}")
        raise HTTPException(status_code=500, detail="Could not create catalog item.")


@router.get("/{business_id}/catalog", response_model=PaginatedCatalog)
def get_business_catalog(
    business_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve catalog list representing items owned by this business tenant."""
    if current_user.business_id != business_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this business.")
    
    total = db.query(Catalog).filter(Catalog.business_id == business_id).count()
    items = (
        db.query(Catalog)
        .filter(Catalog.business_id == business_id)
        .order_by(Catalog.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/{business_id}/orders", response_model=PaginatedOrder)
def get_business_orders(
    business_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all orders placed by customers for this business tenant."""
    if current_user.business_id != business_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this business.")
    # Verify business exists
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found.")
        
    total = db.query(Order).filter(Order.business_id == business_id).count()
    orders = (
        db.query(Order)
        .filter(Order.business_id == business_id)
        .options(joinedload(Order.customer))
        .order_by(Order.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    out = []
    for o in orders:
        out.append(OrderOut(
            id=o.id,
            business_id=o.business_id,
            customer_id=o.customer_id,
            details=o.details,
            status=o.status,
            created_at=o.created_at,
            customer_name=o.customer.name if o.customer else "Unknown Customer",
            customer_phone=o.customer.phone_number if o.customer else "Unknown Phone"
        ))
    return {
        "items": out,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.patch("/{business_id}/orders/{order_id}", response_model=OrderOut)
async def update_order_status(
    business_id: UUID,
    order_id: UUID,
    payload: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update status of a specific order ('pending', 'confirmed', or 'cancelled') and notify the customer via WhatsApp."""
    if current_user.business_id != business_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this business.")
    # Verify business exists
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found.")
        
    order = db.query(Order).filter(Order.id == order_id, Order.business_id == business_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found for this business.")
        
    new_status = payload.get("status")
    if not new_status or new_status not in ["pending", "confirmed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be pending, confirmed, or cancelled.")
        
    old_status = order.status
    try:
        order.status = new_status
        db.commit()
        db.refresh(order)
        
        # Notify customer if status changed and it is confirmed or cancelled
        if new_status != old_status and new_status in ["confirmed", "cancelled"] and order.customer:
            recipient_phone = order.customer.phone_number
            if recipient_phone:
                recipient_phone = recipient_phone.strip()
                # Get or create active Conversation dynamically checking existing conversations for the customer
                conversation = (
                    db.query(Conversation)
                    .filter(
                        Conversation.business_id == business_id,
                        Conversation.customer_id == order.customer_id,
                        Conversation.status == "active"
                    )
                    .order_by(Conversation.created_at.desc())
                    .first()
                )
                if not conversation:
                    # Look for any recent conversation to determine the channel
                    recent_conv = (
                        db.query(Conversation)
                        .filter(
                            Conversation.business_id == business_id,
                            Conversation.customer_id == order.customer_id
                        )
                        .order_by(Conversation.created_at.desc())
                        .first()
                    )
                    channel = recent_conv.channel if recent_conv else "whatsapp"
                    
                    conversation = Conversation(
                        business_id=business_id,
                        customer_id=order.customer_id,
                        channel=channel,
                        status="active"
                    )
                    db.add(conversation)
                    db.commit()
                    db.refresh(conversation)

                # Format notification message content
                if new_status == "confirmed":
                    notification_text = f"Your order (ID: {str(order.id)[:8]}) has been confirmed! Thank you for ordering with us."
                else: # cancelled
                    notification_text = f"Your order (ID: {str(order.id)[:8]}) has been cancelled."
                
                # Log message in database as agent message so it shows in the dashboard chat
                new_msg = Message(
                    conversation_id=conversation.id,
                    sender="agent",
                    content=notification_text
                )
                db.add(new_msg)
                db.commit()
                
                # Send the actual channel message
                biz = db.query(Business).filter(Business.id == business_id).first()
                if conversation.channel == "instagram":
                    from app.services.instagram import send_instagram_message
                    await send_instagram_message(business=biz, recipient_id=recipient_phone, text=notification_text)
                else:
                    from app.services.whatsapp import send_whatsapp_message
                    await send_whatsapp_message(business=biz, to_phone=recipient_phone, text=notification_text)

        return OrderOut(
            id=order.id,
            business_id=order.business_id,
            customer_id=order.customer_id,
            details=order.details,
            status=order.status,
            created_at=order.created_at,
            customer_name=order.customer.name if order.customer else "Unknown Customer",
            customer_phone=order.customer.phone_number if order.customer else "Unknown Phone"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating order status: {e}")
        raise HTTPException(status_code=500, detail="Could not update order status.")


@router.get("/{business_id}/chats", response_model=PaginatedConversation)
def get_business_chats(
    business_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch all conversations representing active WhatsApp customer channels for this business."""
    if current_user.business_id != business_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this business.")
    # Verify business exists
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found.")
        
    total = db.query(Conversation).filter(
        Conversation.business_id == business_id,
        Conversation.channel.in_(["whatsapp", "instagram"])
    ).count()
    
    conversations = (
        db.query(Conversation)
        .filter(Conversation.business_id == business_id, Conversation.channel.in_(["whatsapp", "instagram"]))
        .options(joinedload(Conversation.customer), selectinload(Conversation.messages))
        .order_by(Conversation.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    
    out = []
    for conv in conversations:
        # Load associated messages sorted in chronological order (done in-memory to avoid N+1 query)
        msgs = sorted(conv.messages, key=lambda m: m.created_at)
        mapped_msgs = [
            MessageOut(
                id=m.id,
                conversation_id=m.conversation_id,
                sender=m.sender,
                content=m.content,
                created_at=m.created_at
            ) for m in msgs
        ]
        
        last_msg = mapped_msgs[-1].content if mapped_msgs else "No messages"
        
        out.append(ConversationOut(
            id=conv.id,
            business_id=conv.business_id,
            customer_id=conv.customer_id,
            channel=conv.channel,
            status=conv.status,
            created_at=conv.created_at,
            customer_name=conv.customer.name if conv.customer else ("Instagram User" if conv.channel == "instagram" else "WhatsApp User"),
            customer_phone=conv.customer.phone_number if conv.customer else "Unknown Phone",
            last_message_content=last_msg,
            messages=mapped_msgs,
            is_ai_paused=conv.is_ai_paused,
            ai_pause_reason=conv.ai_pause_reason,
            ai_paused_at=conv.ai_paused_at
        ))
    return {
        "items": out,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/{business_id}/chats/stream")
async def chat_stream(
    business_id: UUID,
    request: Request,
    token: str = Query(..., description="Authentication token passed via query param for EventSource compatibility"),
    db: Session = Depends(get_db)
):
    """
    Server-Sent Events (SSE) endpoint to push real-time refresh signals to the client
    when new messages are received in any chat for this business.
    """
    # 1. Verify token & permissions
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id_str = payload.get("user_id")
        user_biz_id_str = payload.get("business_id")
        if not user_id_str or not user_biz_id_str:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        if UUID(user_biz_id_str) != business_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this business.")
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # 2. Generator that monitors messages via PubSub
    async def event_generator():
        from app.services.pubsub import chat_pubsub
        
        # Subscribe a queue for this business
        queue = chat_pubsub.subscribe(str(business_id))
        
        try:
            while True:
                # If the client disconnected, clean up immediately
                if await request.is_disconnected():
                    break
                
                try:
                    # Wait for a publish signal (suspends execution, 0% CPU/DB load)
                    msg = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {msg}\n\n"
                except asyncio.TimeoutError:
                    # Send a heartbeat comment to keep EventSource connection alive
                    yield ": keepalive\n\n"
        except Exception as e:
            logger.error(f"Error in SSE event stream: {e}")
        finally:
            # Always clean up listener queue on disconnect
            chat_pubsub.unsubscribe(str(business_id), queue)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/{business_id}/chats/{conversation_id}/messages", response_model=MessageOut)
async def send_manual_chat_reply(
    business_id: UUID,
    conversation_id: UUID,
    payload: MessageCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a manual agent message response and transmit it back to the customer's WhatsApp number."""
    if current_user.business_id != business_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this business.")
    # Verify business exists
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found.")
        
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.business_id == business_id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
        
    customer = conv.customer
    if not customer or not customer.phone_number:
        raise HTTPException(status_code=400, detail="Customer phone number not configured.")
        
    try:
        new_msg = Message(
            conversation_id=conversation_id,
            sender="agent",
            content=payload.content
        )
        db.add(new_msg)
        
        # Set manual takeover pause status & metadata
        conv.is_ai_paused = True
        conv.ai_pause_reason = "human_takeover"
        conv.ai_paused_at = datetime.utcnow()
        
        db.commit()
        db.refresh(new_msg)
        
        # Publish real-time event to sync other dashboard tabs/sessions
        from app.services.pubsub import chat_pubsub
        chat_pubsub.publish(str(business_id), "refresh")
        
        # Dispatch channel outbox
        if conv.channel == "instagram":
            from app.services.instagram import send_instagram_message
            await send_instagram_message(business=biz, recipient_id=customer.phone_number, text=payload.content)
        else:
            from app.services.whatsapp import send_whatsapp_message
            await send_whatsapp_message(business=biz, to_phone=customer.phone_number, text=payload.content)
        
        return MessageOut(
            id=new_msg.id,
            conversation_id=new_msg.conversation_id,
            sender=new_msg.sender,
            content=new_msg.content,
            created_at=new_msg.created_at
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error sending manual reply: {e}")
        raise HTTPException(status_code=500, detail="Failed to dispatch and save manual message.")


@router.patch("/{business_id}/chats/{conversation_id}", response_model=ConversationOut)
def update_conversation_status(
    business_id: UUID,
    conversation_id: UUID,
    payload: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle the AI Agent pause flag or update the conversation status."""
    if current_user.business_id != business_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this business.")
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found.")
        
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.business_id == business_id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
        
    if "is_ai_paused" in payload:
        conv.is_ai_paused = bool(payload["is_ai_paused"])
        if not conv.is_ai_paused:
            conv.ai_pause_reason = None
            conv.ai_paused_at = None
            
    if "status" in payload:
        conv.status = payload["status"]
        
    try:
        db.commit()
        db.refresh(conv)
        
        # Load associated messages in chronological order
        msgs = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id)
            .order_by(Message.created_at.asc())
            .all()
        )
        mapped_msgs = [
            MessageOut(
                id=m.id,
                conversation_id=m.conversation_id,
                sender=m.sender,
                content=m.content,
                created_at=m.created_at
            ) for m in msgs
        ]
        
        last_msg = mapped_msgs[-1].content if mapped_msgs else "No messages"
        
        return ConversationOut(
            id=conv.id,
            business_id=conv.business_id,
            customer_id=conv.customer_id,
            channel=conv.channel,
            status=conv.status,
            created_at=conv.created_at,
            customer_name=conv.customer.name if conv.customer else "WhatsApp User",
            customer_phone=conv.customer.phone_number if conv.customer else "Unknown Phone",
            last_message_content=last_msg,
            messages=mapped_msgs,
            is_ai_paused=conv.is_ai_paused
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating conversation settings: {e}")
        raise HTTPException(status_code=500, detail="Could not update conversation settings.")


@router.post("/{business_id}/chats/initiate", response_model=ConversationOut)
async def initiate_new_chat(
    business_id: UUID,
    payload: InitiateChatRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually initiate a new conversation with a customer by sending the first message."""
    if current_user.business_id != business_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this business.")
        
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found.")
        
    # Standardize phone number
    clean_phone = payload.phone_number.strip().replace(" ", "").replace("-", "").replace("+", "")
    if not clean_phone:
        raise HTTPException(status_code=400, detail="Valid phone number is required.")
        
    from app.models import Customer
    # Find or create customer
    customer = db.query(Customer).filter(
        Customer.business_id == business_id,
        Customer.phone_number == clean_phone
    ).first()
    
    if not customer:
        customer = Customer(
            business_id=business_id,
            name=payload.customer_name or "Customer",
            phone_number=clean_phone
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        
    # Find or create conversation
    conv = db.query(Conversation).filter(
        Conversation.business_id == business_id,
        Conversation.customer_id == customer.id,
        Conversation.channel == "whatsapp"
    ).first()
    
    if not conv:
        conv = Conversation(
            business_id=business_id,
            customer_id=customer.id,
            channel="whatsapp",
            status="active",
            is_ai_paused=True,
            ai_pause_reason="human_initiated"
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        
    # Add message
    new_msg = Message(
        conversation_id=conv.id,
        sender="agent",
        content=payload.message
    )
    db.add(new_msg)
    db.commit()
    
    # Send actual WhatsApp message
    from app.services.whatsapp import send_whatsapp_message
    wa_phone = f"whatsapp:+{clean_phone}" if not clean_phone.startswith("whatsapp:") else clean_phone
    await send_whatsapp_message(business=biz, to_phone=wa_phone, text=payload.message)
    
    # Notify dashboard listeners via PubSub
    from app.services.pubsub import chat_pubsub
    chat_pubsub.publish(str(business_id), "refresh")
    
    # Query conversation with loaded relationships
    conv_out = (
        db.query(Conversation)
        .filter(Conversation.id == conv.id)
        .options(joinedload(Conversation.customer), selectinload(Conversation.messages))
        .first()
    )
    
    msgs = sorted(conv_out.messages, key=lambda m: m.created_at)
    mapped_msgs = [
        MessageOut(
            id=m.id,
            conversation_id=m.conversation_id,
            sender=m.sender,
            content=m.content,
            created_at=m.created_at
        ) for m in msgs
    ]
    
    return ConversationOut(
        id=conv_out.id,
        business_id=conv_out.business_id,
        customer_id=conv_out.customer_id,
        channel=conv_out.channel,
        status=conv_out.status,
        created_at=conv_out.created_at,
        customer_name=conv_out.customer.name if conv_out.customer else "WhatsApp User",
        customer_phone=conv_out.customer.phone_number if conv_out.customer else "Unknown Phone",
        last_message_content=payload.message,
        messages=mapped_msgs,
        is_ai_paused=conv_out.is_ai_paused,
        ai_pause_reason=conv_out.ai_pause_reason,
        ai_paused_at=conv_out.ai_paused_at
    )

