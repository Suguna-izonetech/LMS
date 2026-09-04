from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CRMFollowupBase(BaseModel):
    notes: str
    status: str
    followup_date: Optional[datetime] = None

class CRMFollowupCreate(CRMFollowupBase):
    pass

class CRMFollowupResponse(CRMFollowupBase):
    id: int
    lead_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class CRMLeadBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = "New"
    source: Optional[str] = None
    course_interest: Optional[str] = None
    assigned_staff_id: Optional[int] = None

class CRMLeadCreate(CRMLeadBase):
    pass

class CRMLeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None
    assigned_staff_id: Optional[int] = None

class CRMLeadResponse(CRMLeadBase):
    id: int
    institute_id: int
    inquiry_date: datetime
    created_at: datetime
    assigned_staff_name: Optional[str] = None
    followups: List[CRMFollowupResponse] = []
    
    class Config:
        from_attributes = True
        
class CRMDashboardStats(BaseModel):
    total_leads: int
    new_leads: int
    pending_followups: int
    incomplete_leads: int
    converted_leads: int
