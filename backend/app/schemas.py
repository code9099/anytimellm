from pydantic import BaseModel, Field, EmailStr, field_validator
import re
from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any, List

# Business / Tenant
class BusinessCreate(BaseModel):
    name: str

class BusinessOut(BaseModel):
    id: UUID
    name: str
    api_settings: Dict[str, Any]
    business_type: Optional[str] = None
    onboarding_status: str = "pending"
    created_at: datetime

    class Config:
        from_attributes = True

# Catalog / Products
class CatalogCreate(BaseModel):
    category: Optional[str] = None
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)
    is_available: bool = True

class CatalogOut(BaseModel):
    id: UUID
    business_id: UUID
    category: Optional[str]
    name: str
    description: Optional[str]
    price: Optional[float]
    attributes: Dict[str, Any]
    is_available: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Documents
class DocumentOut(BaseModel):
    id: UUID
    business_id: UUID
    file_name: str
    file_type: str
    status: str
    summary: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Web Chat Client
class ChatMessageIn(BaseModel):
    content: str
    customer_phone: str # Identifying phone or username for session isolation

class ChatMessageOut(BaseModel):
    sender: str # 'customer' or 'agent'
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# Orders
class OrderOut(BaseModel):
    id: UUID
    business_id: UUID
    customer_id: UUID
    details: Dict[str, Any]
    status: str
    created_at: datetime
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None

    class Config:
        from_attributes = True


# WhatsApp Chats
class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    sender: str  # 'customer' or 'agent'
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    id: UUID
    business_id: UUID
    customer_id: UUID
    channel: str  # 'whatsapp' or 'web'
    status: str
    created_at: datetime
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    last_message_content: Optional[str] = None
    messages: List[MessageOut] = []
    is_ai_paused: bool = False
    ai_pause_reason: Optional[str] = None
    ai_paused_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    content: str


# Authentication Schemas
class UserRegister(BaseModel):
    business_name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one numeric digit.")
        if not re.search(r"[@$!%*?&_#^()-+=]", v):
            raise ValueError("Password must contain at least one special character (e.g. @$!%*?&_#^()-+=).")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    business_id: UUID

class UserOut(BaseModel):
    id: UUID
    business_id: UUID
    email: str
    created_at: datetime
    trial_expired: bool = False

    class Config:
        from_attributes = True

class GoogleAuthPayload(BaseModel):
    credential: str
    business_name: Optional[str] = None

class GoogleAuthResponse(BaseModel):
    is_registered: bool
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    business_id: Optional[UUID] = None

# Onboarding Schemas
class OnboardingStart(BaseModel):
    business_type: str

class OnboardingChatInput(BaseModel):
    message: str

class OnboardingChatResponse(BaseModel):
    reply: str
    status: str
    chat_history: List[Dict[str, Any]]
    collected: Dict[str, Any]

# Paginated schemas
class PaginatedCatalog(BaseModel):
    items: List[CatalogOut]
    total: int
    page: int
    limit: int

class PaginatedOrder(BaseModel):
    items: List[OrderOut]
    total: int
    page: int
    limit: int

class PaginatedConversation(BaseModel):
    items: List[ConversationOut]
    total: int
    page: int
    limit: int

class PaginatedDocument(BaseModel):
    items: List[DocumentOut]
    total: int
    page: int
    limit: int


class InitiateChatRequest(BaseModel):
    phone_number: str
    customer_name: Optional[str] = "Customer"
    message: str


