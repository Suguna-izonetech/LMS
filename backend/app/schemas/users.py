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
    is_active: Optional[bool] = True

class InstituteUserCreate(InstituteUserBase):
    password: str

class InstituteUserResponse(InstituteUserBase):
    id: int
    institute_id: Optional[int] = None
    created_at: datetime
    is_active: bool = True
    
    class Config:
        from_attributes = True

class UserStatusUpdateRequest(BaseModel):
    is_active: Optional[bool] = None
    status: Optional[str] = None

class BulkUserImportResult(BaseModel):
    success_count: int
    error_count: int
    errors: List[str]
