from pydantic import BaseModel, UUID4, Field
from enum import Enum
from datetime import datetime
from typing import Optional

class WorkOrderPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class WorkOrderStatus(str, Enum):
    new = "new"
    in_progress = "in_progress"
    waiting_parts = "waiting_parts"
    completed = "completed"

class WorkOrderBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: str
    priority: WorkOrderPriority = WorkOrderPriority.medium
    asset_id: UUID4

class WorkOrderCreate(WorkOrderBase):
    pass

class WorkOrder(WorkOrderBase):
    id: UUID4
    status: WorkOrderStatus = WorkOrderStatus.new
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
