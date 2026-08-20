from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReportHistoryResponse(BaseModel):
    id: int
    report_type: str
    status: str
    file_url: Optional[str]
    generated_at: datetime
    
    class Config:
        from_attributes = True

class ReportRequest(BaseModel):
    report_type: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
