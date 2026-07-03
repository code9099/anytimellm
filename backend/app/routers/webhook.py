import hmac
import hashlib
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.orm import Session
from uuid import UUID
from langchain_core.messages import HumanMessage, AIMessage

from app.database import get_db
from app.config import settings
from app.models import Business, Customer, Conversation, Message
from app.services.agent import agent_graph
from app.services.whatsapp import send_whatsapp_message
from app.services.permissions import check_can_use_bot, check_conversation_limit
from app.services.analytics import log_conversion_event

logger = logging.getLogger(__name__)

def verify_meta_signature(body_bytes: bytes, signature_header: str, app_secret: str) -> bool:
    if not signature_header or not app_secret:
        return False
    if signature_header.startswith("sha256="):
        signature = signature_header.split("sha256=")[1]
    else:
        signature = signature_header
    expected_sig = hmac.new(
        app_secret.encode("utf-8"),
        body_bytes,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected_sig, signature)

router = APIRouter(prefix="/api/webhooks/whatsapp", tags=["Meta WhatsApp Webhooks"])

@router.get("/incoming")
def verify_whatsapp_unified_webhook(
    mode: str = Query(None, alias="hub.mode"),
    verify_token: str = Query(None, alias="hub.verify_token"),
    challenge: str = Query(None, alias="hub.challenge")
):
    """Meta unified webhook verification endpoint. Responds to verification challenges globally."""
    print("\n==================================================")
    print(f"[UNIFIED WEBHOOK GET VERIFY] Verification request.")
    print(f"  hub.mode     : {mode}")
    print(f"  hub.challenge: {challenge}")
    print(f"  hub.verify_token: {verify_token}")
    print("==================================================\n")
    logger.info(f"Meta unified webhook verification challenge received")
    
    expected_token = settings.META_WEBHOOK_VERIFY_TOKEN
    fallback_token = settings.META_WA_VERIFY_TOKEN
    
    if mode == "subscribe" and (verify_token == expected_token or verify_token == fallback_token):
        logger.info("Unified Webhook verification succeeded!")
        print("[UNIFIED WEBHOOK GET VERIFY SUCCESS] Verification tokens match!")
        return Response(content=challenge, media_type="text/plain")
        
    logger.warning(f"Unified Webhook verification failed. Expected: {expected_token} or {fallback_token}, Got: {verify_token}")
    print("[UNIFIED WEBHOOK GET VERIFY ERROR] Verification failed!")
    raise HTTPException(status_code=403, detail="Verification token mismatch.")

@router.post("/incoming")
async def handle_incoming_unified_message(
    request: Request,
    db: Session = Depends(get_db)
):
    """Processes incoming WhatsApp messages from the unified App webhook, resolves the business by phone_number_id, and triggers the agent."""
    try:
        body_bytes = await request.body()
        
        app_secret = settings.META_APP_SECRET
        if app_secret:
            signature_header = request.headers.get("x-hub-signature-256")
            if not signature_header:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing signature header.")
            if not verify_meta_signature(body_bytes, signature_header, app_secret):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid request signature.")
        else:
            logger.warning("META_APP_SECRET is not configured. Skipping signature verification for incoming unified webhook.")
            
        body_str = body_bytes.decode("utf-8")
        print("\n==================================================")
        print(f"[UNIFIED WEBHOOK RECEIVE] Incoming payload.")
        print(f"[BODY]: {body_str}")
        print("==================================================\n")
        
        import json
        payload = json.loads(body_str)
        
        entries = payload.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                metadata = value.get("metadata", {})
                phone_number_id = metadata.get("phone_number_id")
                
                # Check for standard messages vs message echoes vs status updates
                messages = value.get("messages", [])
                message_echoes = value.get("message_echoes", [])
                statuses = value.get("statuses", [])
                contacts = value.get("contacts", [])
                
                if not phone_number_id:
                    continue
                    
                # Resolve Business dynamically by phone_number_id and active provider
                try:
                    biz = db.query(Business).filter(
                        Business.api_settings['meta_phone_number_id'].astext == phone_number_id,
                        Business.api_settings['whatsapp_provider'].astext == 'meta'
                    ).first()
                except Exception:
                    # In-memory fallback
                    businesses = db.query(Business).all()
                    biz = next((b for b in businesses if b.api_settings.get("meta_phone_number_id") == phone_number_id and b.api_settings.get("whatsapp_provider") == "meta"), None)
                    
                if not biz:
                    logger.error(f"Business workspace with phone_number_id '{phone_number_id}' not found in database.")
                    print(f"[UNIFIED WEBHOOK ERROR] Business workspace not found for phone_number_id: {phone_number_id}")
                    continue
                
                # Handle status updates (outbound delivery reports or external API messages)
                if statuses:
                    status_item = statuses[0]
                    status_type = status_item.get("status")
                    recipient_phone = status_item.get("recipient_id")
                    
                    if status_type == "sent" and recipient_phone:
                        print(f"[UNIFIED WEBHOOK STATUS] Sent status received for Business ID: {biz.id} ({biz.name}) to: {recipient_phone}")
                        await process_status_sent_event(
                            business_id=biz.id,
                            phone=recipient_phone,
                            db=db
                        )
                    continue
                
                # Handle message echoes (messages sent by the business/agent from external platforms)
                if message_echoes:
                    echo_msg = message_echoes[0]
                    # We only care about text messages for now
                    if echo_msg.get("type") == "text" or "text" in echo_msg:
                        customer_phone = echo_msg.get("to")  # The recipient is the customer
                        message_body = echo_msg.get("text", {}).get("body", "").strip()
                        
                        if customer_phone and message_body:
                            print(f"[UNIFIED WEBHOOK ECHO] Echo received for Business ID: {biz.id} ({biz.name}) to customer: {customer_phone}")
                            await process_outgoing_echo_event(
                                business_id=biz.id,
                                phone=customer_phone,
                                text=message_body,
                                db=db
                            )
                    continue
                    
                if not messages:
                    continue
                    
                msg = messages[0]
                if msg.get("type") != "text":
                    logger.warning(f"Unsupported message type received on unified webhook: {msg.get('type')}")
                    continue
                    
                customer_phone = msg.get("from")
                message_body = msg.get("text", {}).get("body", "").strip()
                
                if not customer_phone or not message_body:
                    continue
                    
                customer_name = "WhatsApp User"
                if contacts:
                    customer_name = contacts[0].get("profile", {}).get("name", "WhatsApp User")
                    
                print(f"[UNIFIED WEBHOOK ROUTE SUCCESS] Resolved Business ID: {biz.id} ({biz.name})")
                await process_single_whatsapp_event(
                    business_id=biz.id,
                    phone=customer_phone,
                    name=customer_name,
                    text=message_body,
                    db=db,
                    meta_message_id=msg.get("id")
                )
                
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to parse incoming unified webhook payload: {e}")
        print(f"[UNIFIED WEBHOOK PARSE ERROR]: {e}")
        return {"status": "error", "message": "Failed to parse body"}

    return {"status": "accepted"}


@router.get("/{business_id}")
def verify_whatsapp_webhook(
    business_id: UUID,
    mode: str = Query(None, alias="hub.mode"),
    verify_token: str = Query(None, alias="hub.verify_token"),
    challenge: str = Query(None, alias="hub.challenge"),
    db: Session = Depends(get_db)
):
    """Meta webhook verification endpoint. Responds to GET request verify challenge."""
    print("\n==================================================")
    print(f"[WEBHOOK GET VERIFY] Received verification request.")
    print(f"  business_id  : {business_id}")
    print(f"  hub.mode     : {mode}")
    print(f"  hub.challenge: {challenge}")
    print(f"  hub.verify_token: {verify_token}")
    print("==================================================\n")
    logger.info(f"Meta webhook verification challenge received for business: {business_id}")
    
    # Verify business exists
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        print(f"[WEBHOOK GET VERIFY ERROR] Business tenant {business_id} not found in database!")
        raise HTTPException(status_code=404, detail="Business tenant not found.")

    # Match verify token
    # Support overriding verification token on a per-business basis, falling back to global settings
    expected_token = biz.api_settings.get("wa_verify_token", settings.META_WA_VERIFY_TOKEN)
    print(f"[WEBHOOK GET VERIFY] Expected verification token: '{expected_token}'")
    print(f"[WEBHOOK GET VERIFY] Received verification token: '{verify_token}'")
    
    if mode == "subscribe" and verify_token == expected_token:
        logger.info("Webhook verification succeeded!")
        print("[WEBHOOK GET VERIFY SUCCESS] Verification tokens match! Returning challenge response.")
        return Response(content=challenge, media_type="text/plain")
        
    logger.warning(f"Webhook verification failed. Expected: {expected_token}, Got: {verify_token}")
    print("[WEBHOOK GET VERIFY ERROR] Verification failed! Tokens do not match or mode is not 'subscribe'.")
    raise HTTPException(status_code=403, detail="Verification token mismatch.")


@router.post("/{business_id}")
async def handle_incoming_whatsapp_message(
    business_id: UUID,
    request: Request,
    db: Session = Depends(get_db)
):
    """Processes incoming WhatsApp messages from Meta, runs the business's LangGraph agent, and sends back replies."""
    try:
        # Verify business exists early
        biz = db.query(Business).filter(Business.id == business_id).first()
        if not biz:
            raise HTTPException(status_code=404, detail="Business tenant not found.")

        body_bytes = await request.body()
        
        app_secret = biz.api_settings.get("meta_app_secret") or settings.META_APP_SECRET
        if app_secret:
            signature_header = request.headers.get("x-hub-signature-256")
            if not signature_header:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing signature header.")
            if not verify_meta_signature(body_bytes, signature_header, app_secret):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid request signature.")
        else:
            logger.warning("Meta App Secret is not configured. Skipping signature verification for incoming business webhook.")

        body_str = body_bytes.decode("utf-8")
        print("\n==================================================")
        print(f"[META WEBHOOK RECEIVE] Business: {business_id}")
        print(f"[META WEBHOOK BODY]: {body_str}")
        print("==================================================\n")
        
        import json
        payload = json.loads(body_str)
        
        entries = payload.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                messages = value.get("messages", [])
                message_echoes = value.get("message_echoes", [])
                statuses = value.get("statuses", [])
                contacts = value.get("contacts", [])
                
                if statuses:
                    status_item = statuses[0]
                    status_type = status_item.get("status")
                    recipient_phone = status_item.get("recipient_id")
                    
                    if status_type == "sent" and recipient_phone:
                        print(f"[META WEBHOOK STATUS] Sent status received for Business ID: {business_id} to: {recipient_phone}")
                        await process_status_sent_event(
                            business_id=business_id,
                            phone=recipient_phone,
                            db=db
                        )
                    continue
                    
                if message_echoes:
                    echo_msg = message_echoes[0]
                    if echo_msg.get("type") == "text" or "text" in echo_msg:
                        customer_phone = echo_msg.get("to")
                        message_body = echo_msg.get("text", {}).get("body", "").strip()
                        
                        if customer_phone and message_body:
                            print(f"[META WEBHOOK ECHO] Echo received for Business ID: {business_id} to customer: {customer_phone}")
                            await process_outgoing_echo_event(
                                business_id=business_id,
                                phone=customer_phone,
                                text=message_body,
                                db=db
                            )
                    continue
                    
                if not messages:
                    continue
                    
                msg = messages[0]
                if msg.get("type") != "text":
                    logger.warning(f"Unsupported message type received: {msg.get('type')}")
                    continue
                    
                customer_phone = msg.get("from")
                message_body = msg.get("text", {}).get("body", "").strip()
                
                if not customer_phone or not message_body:
                    continue
                    
                customer_name = "WhatsApp User"
                if contacts:
                    customer_name = contacts[0].get("profile", {}).get("name", "WhatsApp User")
                    
                await process_single_whatsapp_event(
                    business_id=business_id,
                    phone=customer_phone,
                    name=customer_name,
                    text=message_body,
                    db=db,
                    meta_message_id=msg.get("id")
                )
                    
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to parse incoming webhook payload: {e}")
        print(f"[WEBHOOK PARSE ERROR]: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": "Failed to parse body"}

    return {"status": "accepted"}


async def process_single_whatsapp_event(
    business_id: UUID,
    phone: str,
    name: str,
    text: str,
    db: Session,
    meta_message_id: Optional[str] = None
):
    """Performs customer retrieval, state restoration, LangGraph invocation, and outbound message delivery."""
    try:
        # Check for message deduplication using meta_message_id
        if meta_message_id:
            existing_msg = db.query(Message).filter(Message.meta_message_id == meta_message_id).first()
            if existing_msg:
                print(f"[WEBHOOK DEDUPLICATOR] Duplicate message detected: {meta_message_id}. Skipping execution.")
                return


        # 1. Get or create Customer
        customer = (
            db.query(Customer)
            .filter(Customer.business_id == business_id, Customer.phone_number == phone)
            .first()
        )
        if not customer:
            customer = Customer(
                business_id=business_id,
                phone_number=phone,
                name=name
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)

        # 2. Get or create active Conversation (WhatsApp channel)
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.business_id == business_id,
                Conversation.customer_id == customer.id,
                Conversation.channel == "whatsapp",
                Conversation.status == "active"
            )
            .first()
        )
        if not conversation:
            conversation = Conversation(
                business_id=business_id,
                customer_id=customer.id,
                channel="whatsapp",
                status="active"
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            
            # Log conversion event
            log_conversion_event(db, business_id, "First Conversation")

        # 3. Retrieve recent history for agent context (last 15 messages)
        history_records = (
            db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.desc())
            .limit(15)
            .all()
        )
        history_records.reverse()

        langchain_history = []
        for record in history_records:
            if record.sender == "customer":
                langchain_history.append(HumanMessage(content=record.content))
            else:
                langchain_history.append(AIMessage(content=record.content))

        # Check if conversation is paused for manual takeover
        if conversation.is_ai_paused:
            print(f"[WEBHOOK PROCESS] AI Agent is PAUSED for conversation {conversation.id}. Logging customer message and skipping AI reply.")
            cust_msg = Message(
                conversation_id=conversation.id,
                sender="customer",
                content=text,
                meta_message_id=meta_message_id
            )
            db.add(cust_msg)
            try:
                db.commit()
            except Exception as e:
                db.rollback()
                print(f"[WEBHOOK DEDUPLICATOR] Duplicate message detected on paused flow: {e}")
                return
            print(f"[WEBHOOK PROCESS] Logged messages to DB (Conversation ID: {conversation.id})")
            return

        # Insert customer message early to claim the message ID and prevent duplicate concurrent runs
        cust_msg = Message(
            conversation_id=conversation.id,
            sender="customer",
            content=text,
            meta_message_id=meta_message_id
        )
        db.add(cust_msg)
        try:
            db.commit()
            db.refresh(cust_msg)
        except Exception as e:
            db.rollback()
            print(f"[WEBHOOK DEDUPLICATOR] Failed to insert customer message (possible duplicate): {e}")
            return

        # 3.5 Check Billing Permissions
        if not check_can_use_bot(db, business_id) or not check_conversation_limit(db, business_id):
            print(f"[WEBHOOK PROCESS] Business {business_id} has exceeded billing limits or AI is disabled.")
            return

        # 4. Invoke LangGraph agent
        new_human_msg = HumanMessage(content=text)
        initial_state = {
            "messages": langchain_history + [new_human_msg],
            "business_id": str(business_id),
            "customer_id": str(customer.id),
            "db_results": None,
            "vector_results": None,
            "next_action": None
        }

        print(f"[WEBHOOK PROCESS] Invoking LangGraph agent workflow for message: '{text}'")
        result_state = agent_graph.invoke(initial_state)
        
        agent_reply_msg = result_state["messages"][-1]
        agent_reply_text = agent_reply_msg.content
        print(f"[WEBHOOK PROCESS] Agent response generated: '{agent_reply_text}'")

        # 5. Log agent message to DB
        agent_msg = Message(
            conversation_id=conversation.id,
            sender="agent",
            content=agent_reply_text
        )
        db.add(agent_msg)
        db.commit()
        print(f"[WEBHOOK PROCESS] Logged messages to DB (Conversation ID: {conversation.id})")
        
        # Publish real-time event to refresh front-end UI
        from app.services.pubsub import chat_pubsub
        chat_pubsub.publish(str(business_id), "refresh")

        # 6. Send outgoing reply message via Twilio or Meta WhatsApp API
        biz = db.query(Business).filter(Business.id == business_id).first()
        if biz:
            print(f"[WEBHOOK PROCESS] Sending reply via WhatsApp API for business: {biz.name} to {phone}...")
            await send_whatsapp_message(business=biz, to_phone=phone, text=agent_reply_text)
            print(f"[WEBHOOK PROCESS] Reply sent successfully!")
        else:
            print(f"[WEBHOOK PROCESS ERROR] Business {business_id} not found on reply step.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error processing WhatsApp event: {e}")
        print(f"[WEBHOOK PROCESS ERROR] Exception occurred: {e}")
        import traceback
        traceback.print_exc()


async def process_outgoing_echo_event(
    business_id: UUID,
    phone: str,
    text: str,
    db: Session
):
    """Processes an outgoing message echo event. Logs the message as 'agent' without invoking the AI graph."""
    try:
        # 1. Get or create Customer
        customer = (
            db.query(Customer)
            .filter(Customer.business_id == business_id, Customer.phone_number == phone)
            .first()
        )
        if not customer:
            customer = Customer(
                business_id=business_id,
                phone_number=phone,
                name="WhatsApp User"
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)

        # 2. Get or create active Conversation
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.business_id == business_id,
                Conversation.customer_id == customer.id,
                Conversation.channel == "whatsapp",
                Conversation.status == "active"
            )
            .first()
        )
        if not conversation:
            conversation = Conversation(
                business_id=business_id,
                customer_id=customer.id,
                channel="whatsapp",
                status="active"
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            
            # Log conversion event
            log_conversion_event(db, business_id, "First Conversation")

        # 3. Log the message to DB as 'agent'
        agent_msg = Message(
            conversation_id=conversation.id,
            sender="agent",
            content=text
        )
        db.add(agent_msg)
        db.commit()
        print(f"[WEBHOOK PROCESS ECHO] Successfully logged outgoing echo message to DB (Conversation ID: {conversation.id})")
        
        # Publish real-time event to refresh front-end UI
        from app.services.pubsub import chat_pubsub
        chat_pubsub.publish(str(business_id), "refresh")

    except Exception as e:
        db.rollback()
        logger.error(f"Error processing outgoing WhatsApp echo event: {e}")
        print(f"[WEBHOOK PROCESS ECHO ERROR] Exception occurred: {e}")


async def process_status_sent_event(
    business_id: UUID,
    phone: str,
    db: Session
):
    """Logs a placeholder message if the message was sent externally (i.e. no agent message was logged in the database in the last 5 seconds)."""
    try:
        # 1. Get or create Customer
        customer = (
            db.query(Customer)
            .filter(Customer.business_id == business_id, Customer.phone_number == phone)
            .first()
        )
        if not customer:
            customer = Customer(
                business_id=business_id,
                phone_number=phone,
                name="WhatsApp User"
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)

        # 2. Get or create active Conversation
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.business_id == business_id,
                Conversation.customer_id == customer.id,
                Conversation.channel == "whatsapp",
                Conversation.status == "active"
            )
            .first()
        )
        if not conversation:
            conversation = Conversation(
                business_id=business_id,
                customer_id=customer.id,
                channel="whatsapp",
                status="active"
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            
            # Log conversion event
            log_conversion_event(db, business_id, "First Conversation")

        # 3. Check for recently logged agent messages to avoid duplicating our own outbound dashboard replies
        from datetime import datetime, timedelta
        recent_cutoff = datetime.utcnow() - timedelta(seconds=60)
        
        recent_agent_msg = (
            db.query(Message)
            .filter(
                Message.conversation_id == conversation.id,
                Message.sender == "agent",
                Message.created_at >= recent_cutoff
            )
            .first()
        )
        
        if not recent_agent_msg:
            # No recent message logged -> must have been sent externally via cURL / developer platform
            agent_msg = Message(
                conversation_id=conversation.id,
                sender="agent",
                content="[Message sent externally / via Developer Platform]"
            )
            db.add(agent_msg)
            db.commit()
            print(f"[WEBHOOK PROCESS STATUS] Logged external API message placeholder to DB (Conversation ID: {conversation.id})")
            
            # Publish real-time event to refresh front-end UI
            from app.services.pubsub import chat_pubsub
            chat_pubsub.publish(str(business_id), "refresh")
        else:
            print(f"[WEBHOOK PROCESS STATUS] Status 'sent' matched a recent internal outbound reply. Skipping duplicate logging.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error processing status sent event: {e}")
        print(f"[WEBHOOK PROCESS STATUS ERROR] Exception occurred: {e}")
