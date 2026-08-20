from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class LectureBase(BaseModel):
    title: str
    description: Optional[str] = None
    video_url: Optional[str] = None
    ordering: Optional[int] = 0
    status: Optional[str] = "Draft"

class LectureCreate(LectureBase):
    pass

class LectureUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    ordering: Optional[int] = None
    status: Optional[str] = None

class LectureResponse(LectureBase):
    id: int
    module_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    course_id: int
    status: Optional[str] = "Draft"

class ModuleCreate(ModuleBase):
    pass

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    course_id: Optional[int] = None
    status: Optional[str] = None

class ModuleResponse(ModuleBase):
    id: int
    institute_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    lectures: List[LectureResponse] = []
    course_title: Optional[str] = None

    class Config:
        from_attributes = True
