from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app import models, schemas
from app.api import deps
import uuid
from datetime import datetime, timedelta
import random
import string

router = APIRouter()

@router.get("/stats", response_model=schemas.WorkOrderStats)
async def get_work_order_stats(
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    current_tenant: models.Tenant = Depends(deps.get_current_tenant),
) -> Any:
    """
    Get work order statistics.
    """
    if not current_tenant:
        raise HTTPException(status_code=400, detail="Tenant context required")

    # Total
    total_query = select(func.count(models.WorkOrder.id)).where(models.WorkOrder.tenant_id == current_tenant.id)
    total_res = await db.execute(total_query)
    total = total_res.scalar_one()

    # By Status (Modified for Daily View)
    # For active statuses, we want the current backlog count.
    # For 'completed', we strictly want TODAY's completions.
    
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Active statuses count
    active_query = select(models.WorkOrder.status, func.count(models.WorkOrder.id)).where(
        models.WorkOrder.tenant_id == current_tenant.id,
        models.WorkOrder.status != "completed",
        models.WorkOrder.status != "cancelled"
    ).group_by(models.WorkOrder.status)
    active_res = await db.execute(active_query)
    by_status = {r.status: r.count for r in active_res.all()}
    
    # Daily Completed count
    completed_today_query = select(func.count(models.WorkOrder.id)).where(
        models.WorkOrder.tenant_id == current_tenant.id,
        models.WorkOrder.status == "completed",
        models.WorkOrder.completed_at >= today_start
    )
    completed_res = await db.execute(completed_today_query)
    by_status["completed"] = completed_res.scalar_one()

    # By Priority
    priority_query = select(models.WorkOrder.priority, func.count(models.WorkOrder.id)).where(
        models.WorkOrder.tenant_id == current_tenant.id
    ).group_by(models.WorkOrder.priority)
    priority_res = await db.execute(priority_query)
    by_priority = {r.priority: r.count for r in priority_res.all()}

    return {
        "total": total,
        "by_status": by_status,
        "by_priority": by_priority
    }

@router.get("/", response_model=List[schemas.WorkOrder])
async def read_work_orders(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    current_user: models.User = Depends(deps.get_current_active_user),
    current_tenant: models.Tenant = Depends(deps.get_current_tenant),
) -> Any:
    """
    Retrieve work orders with filtering.
    """
    if not current_tenant:
        raise HTTPException(status_code=400, detail="Tenant context required")
        
    from sqlalchemy.orm import selectinload
    
    query = select(models.WorkOrder).where(models.WorkOrder.tenant_id == current_tenant.id).options(
        selectinload(models.WorkOrder.assigned_to),
        selectinload(models.WorkOrder.completed_by)
    )
    
    if status:
        query = query.where(models.WorkOrder.status == status)
    if priority:
        query = query.where(models.WorkOrder.priority == priority)
    if search:
        query = query.where(models.WorkOrder.title.like(f"%{search}%"))
        
    query = query.order_by(models.WorkOrder.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=schemas.WorkOrder)
async def create_work_order(
    *,
    db: AsyncSession = Depends(deps.get_db),
    work_order_in: schemas.WorkOrderCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
    current_tenant: models.Tenant = Depends(deps.get_current_tenant),
) -> Any:
    if not current_tenant:
        raise HTTPException(status_code=400, detail="Tenant context required")
        
    # Generate Unique WO Number
    # WO-{YYMMDD}-{HHMM}-{RAND}
    now_str = datetime.utcnow().strftime("%y%m%d-%H%M")
    rand_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    wo_number = f"WO-{now_str}-{rand_suffix}"

    db_obj = models.WorkOrder(
        **work_order_in.dict(),
        work_order_number=wo_number,
        tenant_id=current_tenant.id,
        reported_by_user_id=current_user.id
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

from sqlalchemy.orm import selectinload
from datetime import datetime

# ... imports ...

@router.get("/{work_order_id}", response_model=schemas.WorkOrder)
async def read_work_order(
    *,
    db: AsyncSession = Depends(deps.get_db),
    work_order_id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
    current_tenant: models.Tenant = Depends(deps.get_current_tenant),
) -> Any:
    """
    Get work order by ID.
    """
    if not current_tenant:
        raise HTTPException(status_code=400, detail="Tenant context required")
        
    result = await db.execute(
        select(models.WorkOrder)
        .where(models.WorkOrder.id == work_order_id, models.WorkOrder.tenant_id == current_tenant.id)
        .options(
            selectinload(models.WorkOrder.assigned_to),
            selectinload(models.WorkOrder.completed_by)
        )
    )
    wo = result.scalars().first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")
    return wo

@router.put("/{work_order_id}", response_model=schemas.WorkOrder)
async def update_work_order(
    *,
    db: AsyncSession = Depends(deps.get_db),
    work_order_id: uuid.UUID,
    work_order_in: schemas.WorkOrderUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
    current_tenant: models.Tenant = Depends(deps.get_current_tenant),
) -> Any:
    """
    Update a work order.
    """
    if not current_tenant:
        raise HTTPException(status_code=400, detail="Tenant context required")
        
    result = await db.execute(select(models.WorkOrder).where(
        models.WorkOrder.id == work_order_id,
        models.WorkOrder.tenant_id == current_tenant.id
    ))
    wo = result.scalars().first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")
        
    update_data = work_order_in.dict(exclude_unset=True)
    
    # Status Change Logic
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == "in_progress" and wo.status != "in_progress":
            # Assign to current user if not already assigned (or re-assign?)
            # User requirement: "who logged into them". 
            # I'll update assigned_to to the person starting it.
            wo.assigned_to_user_id = current_user.id
            wo.started_at = datetime.utcnow()
            
        if new_status == "completed" and wo.status != "completed":
            wo.completed_by_user_id = current_user.id
            # Allow manual override if provided in payload, else use now
            if update_data.get("completed_at"):
                wo.completed_at = update_data["completed_at"]
            else:
                wo.completed_at = datetime.utcnow()
            
    for field, value in update_data.items():
        setattr(wo, field, value)
        
    db.add(wo)
    await db.commit()
    await db.refresh(wo)
    
    # Re-fetch for relationships
    result = await db.execute(
        select(models.WorkOrder)
        .where(models.WorkOrder.id == work_order_id)
        .options(
            selectinload(models.WorkOrder.assigned_to),
            selectinload(models.WorkOrder.completed_by)
        )
    )
    return result.scalars().first()
