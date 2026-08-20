from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InstitutePlanAddonResponse(BaseModel):
    id: int
    addon_name: str
    status: str
    activation_date: Optional[datetime]
    
    class Config:
        from_attributes = True
