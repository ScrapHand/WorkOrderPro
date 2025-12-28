from typing import Optional
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

class WorkOrderUpdate(WorkOrderBase):
    title: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    completion_notes: Optional[str] = None
    signed_by_name: Optional[str] = None
    completed_at: Optional[datetime] = None # Allow manual override

from .user import User

class WorkOrder(WorkOrderBase):
    id: UUID4
    tenant_id: UUID4
    work_order_number: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    # Nested relationships for display
    assigned_to: Optional[User] = None
    completed_by: Optional[User] = None

    class Config:
        from_attributes = True

class WorkOrderStats(BaseModel):
    active_total: int
    total: int
    by_status: dict
    by_priority: dict
