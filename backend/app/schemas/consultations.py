from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ConsultationSlotBase(BaseModel):
    date: datetime
    start_time: datetime
    end_time: datetime
    status: Optional[str] = "available"

class ConsultationSlotCreate(ConsultationSlotBase):
    pass

class ConsultationSlotResponse(ConsultationSlotBase):
    id: int
    consultation_id: int

    class Config:
        from_attributes = True

class ConsultationBase(BaseModel):
    title: str
    description: Optional[str] = None
    consultant_id: int
    duration_minutes: int
    pricing: float
    status: Optional[str] = "active"

class ConsultationCreate(ConsultationBase):
    pass

class ConsultationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    consultant_id: Optional[int] = None
    duration_minutes: Optional[int] = None
    pricing: Optional[float] = None
    status: Optional[str] = None

class ConsultationResponse(ConsultationBase):
    id: int
    institute_id: Optional[int] = None
    created_at: datetime
    consultant_name: Optional[str] = None
    slots: List[ConsultationSlotResponse] = []

    class Config:
        from_attributes = True

class ConsultationBookingResponse(BaseModel):
    id: int
    slot_id: int
    student_id: int
    student_name: Optional[str] = None
    consultation_title: Optional[str] = None
    date: datetime
    start_time: datetime
    booking_status: str
    payment_status: str
    amount_paid: float
    created_at: datetime

    class Config:
        from_attributes = True
