from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class InstituteUserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str # student, teacher, InstituteAdmin
    status: Optional[str] = "active"

class InstituteUserCreate(InstituteUserBase):
    password: str

class InstituteUserResponse(InstituteUserBase):
    id: int
    institute_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class BulkUserImportResult(BaseModel):
    success_count: int
    error_count: int
    errors: List[str]
