from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class WorkflowActionBase(BaseModel):
    action_type: str
    action_payload: str
    order_index: int

class WorkflowActionResponse(WorkflowActionBase):
    id: int
    workflow_id: int
    
    class Config:
        from_attributes = True

class WorkflowBase(BaseModel):
    name: str
    trigger_event: str
    is_active: bool
    conditions: str

class WorkflowCreate(WorkflowBase):
    actions: List[WorkflowActionBase]

class WorkflowResponse(WorkflowBase):
    id: int
    institute_id: int
    created_at: datetime
    actions: List[WorkflowActionResponse] = []
    
    class Config:
        from_attributes = True

class WorkflowLogResponse(BaseModel):
    id: int
    workflow_id: int
    trigger_payload: str
    status: str
    error_message: Optional[str]
    execution_date: datetime
    
    class Config:
        from_attributes = True
