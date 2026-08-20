from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class NotificationBase(BaseModel):
    title: str
    message: str
    target_audience: str = "all"
    status: str = "draft"
    scheduled_date: Optional[datetime] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: int
    institute_id: int
    published_date: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
