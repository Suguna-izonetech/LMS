from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ChatUser(BaseModel):
    id: int
    name: str
    email: str
    role: str

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    receiver_id: int

class MessageResponse(MessageBase):
    id: int
    conversation_id: int
    sender_id: int
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    other_user_id: int
    other_user_name: str
    last_message: Optional[str]
    last_message_at: Optional[datetime]
    unread_count: int

    class Config:
        from_attributes = True
