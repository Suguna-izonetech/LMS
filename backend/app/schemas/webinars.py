from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class WebinarBase(BaseModel):
    title: str
    description: Optional[str] = None
    speaker_name: str
    speaker_details: Optional[str] = None
    course_id: int
    scheduled_date: datetime
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    meeting_provider: Optional[str] = "zoom"
    meeting_url: Optional[str] = None
    status: Optional[str] = "upcoming"

class WebinarCreate(WebinarBase):
    pass

class WebinarUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    speaker_name: Optional[str] = None
    speaker_details: Optional[str] = None
    course_id: Optional[int] = None
    scheduled_date: Optional[datetime] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    meeting_provider: Optional[str] = None
    meeting_url: Optional[str] = None
    status: Optional[str] = None

class WebinarResponse(WebinarBase):
    id: int
    institute_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    course_title: Optional[str] = None

    class Config:
        from_attributes = True
