from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TransactionBase(BaseModel):
    amount: float
    currency: str
    payment_gateway: str
    payment_status: str
    invoice_reference_id: str
    transaction_date: datetime

class TransactionResponse(TransactionBase):
    id: int
    institute_id: int
    student_id: int
    course_id: Optional[int] = None
    
    # Extra fields for frontend
    student_name: Optional[str] = None
    course_name: Optional[str] = None

    class Config:
        from_attributes = True

class MonthlySummaryItem(BaseModel):
    month: str # e.g. "2023-10"
    total_amount: float
