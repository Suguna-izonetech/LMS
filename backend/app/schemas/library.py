from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class BookBase(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    status: Optional[str] = "draft"

class BookCreate(BookBase):
    pass

class BookUpdate(BookBase):
    title: Optional[str] = None
    author: Optional[str] = None
    status: Optional[str] = None

class BookResponse(BookBase):
    id: int
    institute_id: Optional[int] = None
    file_url: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StudyMaterialBase(BaseModel):
    title: str
    description: Optional[str] = None
    course_id: int
    batch_id: Optional[int] = None
    material_type: Optional[str] = "Notes"
    visibility: Optional[str] = "public"
    status: Optional[str] = "draft"

class StudyMaterialCreate(StudyMaterialBase):
    pass

class StudyMaterialUpdate(StudyMaterialBase):
    title: Optional[str] = None
    course_id: Optional[int] = None

class StudyMaterialResponse(StudyMaterialBase):
    id: int
    institute_id: Optional[int] = None
    file_url: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    course_title: Optional[str] = None

    class Config:
        from_attributes = True
