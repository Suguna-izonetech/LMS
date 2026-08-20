from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class IntegrationBase(BaseModel):
    provider_type: str
    provider_name: str
    status: str

class IntegrationResponse(IntegrationBase):
    id: int
    institute_id: int
    credentials: Dict[str, Any] # Will be masked
    updated_at: datetime
    
    class Config:
        from_attributes = True

class IntegrationUpdate(BaseModel):
    provider_name: str
    credentials: Dict[str, Any]
    status: str
