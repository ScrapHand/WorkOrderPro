from typing import Optional, Any, List
from pydantic import BaseModel, UUID4
from datetime import datetime
from enum import Enum

class WorkOrderBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "new"
    priority: str = "low"
    asset_id: Optional[UUID4] = None
    completed_by_user_id: Optional[UUID4] = None
    completion_notes: Optional[str] = None
    signed_by_name: Optional[str] = None

class WorkOrderCreate(WorkOrderBase):
    pass

    from pydantic import field_validator

    @field_validator('status', 'priority', mode='before', check_fields=False)
    @classmethod
    def normalize_fields(cls, v):
        if isinstance(v, str):
            return v.lower()
        return v

class WorkOrderUpdate(WorkOrderBase):
    title: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    completion_notes: Optional[str] = None
    signed_by_name: Optional[str] = None
    completed_at: Optional[datetime] = None # Allow manual override

from .user import User

class WorkOrderSession(BaseModel):
    id: UUID4
    user_id: UUID4
    user: Optional[User] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class WorkOrder(WorkOrderBase):
    id: UUID4
    tenant_id: UUID4
    work_order_number: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    # Nested relationships for display
    assigned_to: Optional[User] = None
    completed_by: Optional[User] = None
    # We need a basic asset schema here to avoid circular imports, or just use dict/Any for now
    asset: Optional[Any] = None 
    active_sessions: List[WorkOrderSession] = []

    class Config:
        from_attributes = True
        use_enum_values = True

    from pydantic import field_validator

    @field_validator('status', 'priority', mode='before', check_fields=False)
    @classmethod
    def normalize_fields(cls, v):
        if isinstance(v, str):
            return v.lower()
        return v

class WorkOrderStats(BaseModel):
    active_total: int
    total: int
    by_status: dict
    by_priority: dict
