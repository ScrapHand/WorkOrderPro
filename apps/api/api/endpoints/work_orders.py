from fastapi import APIRouter, HTTPException, status
from typing import List
from uuid import uuid4
from datetime import datetime
from ...schemas.work_order import WorkOrder, WorkOrderCreate, WorkOrderStatus

router = APIRouter()

# In-memory storage for MVP
work_orders_db = []

@router.post("/", response_model=WorkOrder, status_code=status.HTTP_201_CREATED)
async def create_work_order(work_order_in: WorkOrderCreate):
    """
    Create a new work order.
    """
    new_work_order = WorkOrder(
        id=uuid4(),
        **work_order_in.model_dump(),
        status=WorkOrderStatus.new,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    work_orders_db.append(new_work_order)
    return new_work_order

@router.get("/", response_model=List[WorkOrder])
async def list_work_orders():
    """
    List all work orders.
    """
    return work_orders_db
