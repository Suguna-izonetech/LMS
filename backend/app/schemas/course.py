from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CourseBase(BaseModel):
    title: str
    code: str
    description: Optional[str] = None
    course_type: Optional[str] = "Online"
    visibility: Optional[str] = "Public"
    status: Optional[str] = "Draft"
    thumbnail_url: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    course_type: Optional[str] = None
    visibility: Optional[str] = None
    status: Optional[str] = None
    thumbnail_url: Optional[str] = None

class CourseResponse(CourseBase):
    id: int
    institute_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    active_batches_count: Optional[int] = 0

    class Config:
        from_attributes = True
