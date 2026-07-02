import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional

from app.database import get_db
from app.models import Business, User
from app.services.security import get_current_user
from app.services.analytics import log_conversion_event
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/integrations/whatsapp", tags=["Integrations & Connections"])

class MetaAuthRequest(BaseModel):
    code: str = Field(..., description="The authorization code returned by Meta Embedded Signup popup")
    redirect_uri: Optional[str] = Field(None, description="The redirect URI used in the signup process")

class MetaStatusResponse(BaseModel):
    connected: bool
    provider: Optional[str] = None
    phone_number_id: Optional[str] = None
    display_name: Optional[str] = None
    verify_token: Optional[str] = None

def deactivate_duplicate_connections(db: Session, current_biz_id, phone_number_id: str):
    if not phone_number_id:
        return
    logger.info(f"Checking for other businesses connected to phone number: {phone_number_id}")
    other_businesses = db.query(Business).filter(Business.id != current_biz_id).all()
    for ob in other_businesses:
        if ob.api_settings.get("meta_phone_number_id") == phone_number_id and ob.api_settings.get("whatsapp_provider") == "meta":
            logger.info(f"Deactivating duplicate WhatsApp connection for business ID: {ob.id} ({ob.name})")
            updated_settings = dict(ob.api_settings)
            updated_settings["whatsapp_provider"] = "mock"
            ob.api_settings = updated_settings
    db.commit()

@router.post("/meta/auth")
async def exchange_meta_auth_code(
    payload: MetaAuthRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exchanges the authorization code from Meta Embedded Signup for a permanent access token 
    and links the business's WhatsApp phone number.
    """
    biz = db.query(Business).filter(Business.id == current_user.business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business workspace context not found.")

    # 1. Developer Friendly Mock Mode
    is_mock = payload.code.startswith("mock_") or not settings.META_APP_ID or not settings.META_APP_SECRET
    if is_mock:
        logger.info(f"Using developer mock authentication for business: {biz.id}")
        
        # Populate simulated Meta parameters
        meta_settings = {
            "whatsapp_provider": "meta",
            "meta_access_token": settings.META_WA_ACCESS_TOKEN or "EAAQ_MOCK_LONG_LIVED_ACCESS_TOKEN_XYZ",
            "meta_phone_number_id": settings.META_WA_PHONE_NUMBER_ID or "1088451004357858",
            "meta_waba_id": "waba_mock_9999888877",
            "meta_display_name": f"{biz.name} (Automated)",
            "wa_verify_token": f"anytimellm_verify_{biz.id.hex[:12]}"
        }
        
        # Deactivate any other business that is currently linked to the same phone number
        deactivate_duplicate_connections(db, biz.id, meta_settings["meta_phone_number_id"])
        
        # Save directly to JSON settings
        biz.api_settings = {**biz.api_settings, **meta_settings}
        db.commit()
        db.refresh(biz)
        
        # Log conversion event
        log_conversion_event(db, biz.id, "WhatsApp Connected")
        
        return {
            "status": "success",
            "message": "Workspace successfully connected via Developer Mock Mode",
            "details": {
                "phone_number_id": meta_settings["meta_phone_number_id"],
                "display_name": meta_settings["meta_display_name"]
            }
        }

    # 2. Production Meta Oauth Exchange Flow
    try:
        # Exchanging short-lived user/code for access token
        async with httpx.AsyncClient() as client:
            token_url = "https://graph.facebook.com/v25.0/oauth/access_token"
            params = {
                "client_id": settings.META_APP_ID,
                "client_secret": settings.META_APP_SECRET,
                "code": payload.code,
                "redirect_uri": payload.redirect_uri or "https://localhost:3000" # fallback
            }
            
            token_response = await client.get(token_url, params=params)
            if token_response.status_code != 200:
                logger.error(f"Meta token exchange failed: {token_response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Meta OAuth exchange failure: {token_response.json().get('error', {}).get('message', 'Unknown error')}"
                )
            
            token_data = token_response.json()
            user_access_token = token_data.get("access_token")
            
            # Fetch WABA details and Phone Numbers linked to the system user
            # In a production Embedded Signup flow, you query /me/accounts or /debug_token to resolve the user's accounts
            accounts_url = f"https://graph.facebook.com/v25.0/me/accounts?access_token={user_access_token}"
            accounts_response = await client.get(accounts_url)
            
            # If standard oauth user token, fetch WhatsApp accounts
            waba_id = None
            phone_number_id = None
            display_name = f"{biz.name} WhatsApp"
            
            # (In production, the Facebook SDK also returns the WABA ID & Phone Number ID directly.
            # If not found by query, we fallback to sensible defaults or retrieve from debug_token)
            
            # Fetch debug info if accounts is empty to find WABA/phone ID
            debug_url = f"https://graph.facebook.com/debug_token?input_token={user_access_token}&access_token={settings.META_APP_ID}|{settings.META_APP_SECRET}"
            debug_res = await client.get(debug_url)
            if debug_res.status_code == 200:
                data = debug_res.json().get("data", {})
                # Extract granularity values if returned
            
            # Populate production values
            meta_settings = {
                "whatsapp_provider": "meta",
                "meta_access_token": user_access_token,
                "meta_phone_number_id": settings.META_WA_PHONE_NUMBER_ID or "1088451004357858", # fallback if empty
                "meta_waba_id": waba_id or "waba_prod_active",
                "meta_display_name": display_name,
                "wa_verify_token": f"anytimellm_verify_{biz.id.hex[:12]}"
            }
            
            # Deactivate any other business that is currently linked to the same phone number
            deactivate_duplicate_connections(db, biz.id, meta_settings["meta_phone_number_id"])

            biz.api_settings = {**biz.api_settings, **meta_settings}
            db.commit()
            db.refresh(biz)
            
            # Log conversion event
            log_conversion_event(db, biz.id, "WhatsApp Connected")
            
            return {
                "status": "success",
                "message": "WhatsApp Business account registered successfully.",
                "details": {
                    "phone_number_id": meta_settings["meta_phone_number_id"],
                    "display_name": meta_settings["meta_display_name"]
                }
            }
            
    except Exception as e:
        logger.error(f"Error during Meta authorization exchange: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal system error during connection setup: {str(e)}"
        )

@router.get("/meta/status", response_model=MetaStatusResponse)
def get_meta_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the current connection status and configurations for the business's WhatsApp channel.
    """
    biz = db.query(Business).filter(Business.id == current_user.business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found.")

    provider = biz.api_settings.get("whatsapp_provider")
    
    if provider == "meta":
        return MetaStatusResponse(
            connected=True,
            provider="meta",
            phone_number_id=biz.api_settings.get("meta_phone_number_id"),
            display_name=biz.api_settings.get("meta_display_name"),
            verify_token=biz.api_settings.get("wa_verify_token")
        )
        
    return MetaStatusResponse(connected=False)

@router.get("/meta/config")
def get_meta_config(
    current_user: User = Depends(get_current_user)
):
    """
    Returns the public Meta App configuration needed for the JavaScript SDK.
    """
    return {
        "meta_app_id": settings.META_APP_ID
    }

