from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class LiveClassBase(BaseModel):
    title: str
    description: Optional[str] = None
    course_id: int
    batch_id: int
    scheduled_date: datetime
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    meeting_provider: Optional[str] = "zoom"
    meeting_link: Optional[str] = None
    status: Optional[str] = "upcoming"
    recording_url: Optional[str] = None

class LiveClassCreate(LiveClassBase):
    teacher_id: int

class LiveClassUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    meeting_provider: Optional[str] = None
    meeting_link: Optional[str] = None
    status: Optional[str] = None
    recording_url: Optional[str] = None

class LiveClassResponse(LiveClassBase):
    id: int
    institute_id: Optional[int] = None
    teacher_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    course_title: Optional[str] = None
    batch_name: Optional[str] = None

    class Config:
        from_attributes = True
        
class AttendanceRecord(BaseModel):
    student_id: int
    student_name: str
    status: str
