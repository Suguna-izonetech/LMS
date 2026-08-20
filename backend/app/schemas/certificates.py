from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CertificateTemplateBase(BaseModel):
    name: str
    title: str
    body_text: str
    layout: str = "standard"
    status: str = "active"

class CertificateTemplateCreate(CertificateTemplateBase):
    pass

class CertificateTemplateUpdate(CertificateTemplateBase):
    pass

class CertificateTemplateResponse(CertificateTemplateBase):
    id: int
    institute_id: int
    logo_url: Optional[str] = None
    signature_url: Optional[str] = None

    class Config:
        from_attributes = True

class CertificateRecordCreate(BaseModel):
    student_id: int
    course_id: int
    template_id: int
    status: str = "issued"

class CertificateRecordResponse(BaseModel):
    id: int
    institute_id: int
    student_id: int
    course_id: int
    template_id: int
    issue_date: datetime
    certificate_number: str
    status: str
    
    # Extra fields
    student_name: Optional[str] = None
    course_name: Optional[str] = None
    template_name: Optional[str] = None

    class Config:
        from_attributes = True
