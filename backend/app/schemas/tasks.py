from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TaskAttachmentBase(BaseModel):
    file_name: str
    file_url: str

class TaskAttachmentResponse(TaskAttachmentBase):
    id: int
    task_id: int

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    course_id: int
    batch_id: Optional[int] = None
    deadline: datetime
    status: Optional[str] = "draft"

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    course_id: Optional[int] = None
    batch_id: Optional[int] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None

class TaskResponse(TaskBase):
    id: int
    institute_id: Optional[int] = None
    teacher_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    course_title: Optional[str] = None
    batch_name: Optional[str] = None
    attachments: List[TaskAttachmentResponse] = []

    class Config:
        from_attributes = True
