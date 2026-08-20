from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InstituteBillingConfigBase(BaseModel):
    gst_enabled: bool
    gst_number: Optional[str] = None
    legal_business_name: Optional[str] = None
    billing_address: Optional[str] = None
    tax_percentage: float
    invoice_prefix: str
    currency: str

class InstituteBillingConfigUpdate(InstituteBillingConfigBase):
    pass

class InstituteBillingConfigResponse(InstituteBillingConfigBase):
    id: int
    institute_id: int
    next_invoice_number: int
    
    class Config:
        from_attributes = True

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    student_name: str
    course_name: str
    subtotal: float
    tax_amount: float
    total_amount: float
    payment_reference: Optional[str]
    status: str
    issue_date: datetime
    
    class Config:
        from_attributes = True
