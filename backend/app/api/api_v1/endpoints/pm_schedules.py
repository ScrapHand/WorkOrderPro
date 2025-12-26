from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.core import PMSchedule, Asset
from pydantic import BaseModel, UUID4
from datetime import datetime

router = APIRouter()

@router.post("/process-due")
async def process_due_pms(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Check all active PM schedules and generate work orders if next_due is reached.
    """
    from sqlalchemy.future import select
    from app.models.core import PMSchedule, WorkOrder, WorkOrderStatus
    from datetime import datetime
    import random
    import string
    
    now = datetime.utcnow()
    
    query = select(PMSchedule).where(
        PMSchedule.tenant_id == current_user.tenant_id,
        PMSchedule.is_active == True,
        PMSchedule.next_due <= now
    )
    result = await db.execute(query)
    due_schedules = result.scalars().all()
    
    created_count = 0
    for schedule in due_schedules:
        # Generate Unique WO Number
        wo_now_str = now.strftime("%y%m%d-%H%M")
        wo_rand = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        wo_number = f"PM-AUTO-{wo_now_str}-{wo_rand}"

        wo = WorkOrder(
            tenant_id=current_user.tenant_id,
            title=f"SCHEDULED PM: {schedule.title}",
            description=f"Auto-generated from PM Schedule. Frequency: {schedule.frequency_interval} {schedule.frequency_type}",
            status=WorkOrderStatus.new,
            priority="low",
            asset_id=schedule.asset_id,
            work_order_number=wo_number,
            reported_by_user_id=current_user.id
        )
        db.add(wo)
        
        # Advance next due so we don't double-create (unless interval is tiny, but usually it's days)
        # We don't mark as "performed" yet, that happens on sign-off.
        # But we must push the next_due away.
        interval = schedule.frequency_interval
        freq = schedule.frequency_type.lower()
        from datetime import timedelta
        if freq == "days":
            schedule.next_due += timedelta(days=interval)
        elif freq == "weeks":
            schedule.next_due += timedelta(weeks=interval)
        elif freq == "months":
            schedule.next_due += timedelta(days=30 * interval)
        elif freq == "years":
            schedule.next_due += timedelta(days=365 * interval)
            
        db.add(schedule)
        created_count += 1
        
    await db.commit()
    return {"message": f"Processed {created_count} schedules", "created": created_count}

class PMScheduleBase(BaseModel):
    title: str
    description: Optional[str] = None
    frequency_type: str = "days"
    frequency_interval: int = 1
    asset_id: Optional[UUID4] = None
    next_due: Optional[datetime] = None
    assigned_to_user_id: Optional[UUID4] = None
    is_active: bool = True

class PMScheduleCreate(PMScheduleBase):
    pass

class PMScheduleUpdate(PMScheduleBase):
    title: Optional[str] = None

class AssetSimpleOut(BaseModel):
    id: UUID4
    name: str
    class Config:
        from_attributes = True

class PMScheduleOut(PMScheduleBase):
    id: UUID4
    tenant_id: UUID4
    last_performed: Optional[datetime]
    asset: Optional[AssetSimpleOut] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[PMScheduleOut])
async def read_pm_schedules(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve PM schedules for the current tenant.
    """
    from sqlalchemy.future import select
    from sqlalchemy.orm import selectinload
    query = (
        select(PMSchedule)
        .options(selectinload(PMSchedule.asset))
        .filter(PMSchedule.tenant_id == current_user.tenant_id)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=PMScheduleOut)
async def create_pm_schedule(
    schedule_in: PMScheduleCreate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Create new PM schedule.
    """
    schedule = PMSchedule(
        **schedule_in.dict(),
        tenant_id=current_user.tenant_id
    )
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    return schedule

@router.get("/{id}", response_model=PMScheduleOut)
async def read_pm_schedule(
    id: UUID4,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Get PM schedule by ID.
    """
    from sqlalchemy.future import select
    query = select(PMSchedule).filter(PMSchedule.id == id, PMSchedule.tenant_id == current_user.tenant_id)
    result = await db.execute(query)
    schedule = result.scalars().first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule

@router.put("/{id}", response_model=PMScheduleOut)
async def update_pm_schedule(
    id: UUID4,
    schedule_in: PMScheduleUpdate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Update a PM schedule.
    """
    from sqlalchemy.future import select
    query = select(PMSchedule).filter(PMSchedule.id == id, PMSchedule.tenant_id == current_user.tenant_id)
    result = await db.execute(query)
    schedule = result.scalars().first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    update_data = schedule_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(schedule, field, value)
        
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    return schedule

class PMSignOff(BaseModel):
    notes: Optional[str] = None

@router.post("/{id}/sign-off")
async def sign_off_pm(
    id: UUID4,
    sign_off: PMSignOff,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Sign off a PM schedule directly. 
    Increments next_due and logs the completion.
    Also creates a Work Order record for the registry.
    """
    from sqlalchemy.future import select
    from app.models.core import PMLog, WorkOrder, WorkOrderStatus
    from datetime import timedelta
    import random
    import string
    query = select(PMSchedule).filter(PMSchedule.id == id, PMSchedule.tenant_id == current_user.tenant_id)
    result = await db.execute(query)
    schedule = result.scalars().first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    now = datetime.utcnow()
    
    # 1. Create PM Log
    log = PMLog(
        tenant_id=current_user.tenant_id,
        pm_schedule_id=schedule.id,
        completed_at=now,
        completed_by_user_id=current_user.id,
        notes=sign_off.notes
    )
    db.add(log)
    
    # 2. Create actual Work Order for the registry
    wo_now_str = now.strftime("%y%m%d-%H%M")
    wo_rand = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    wo_number = f"PM-WO-{wo_now_str}-{wo_rand}"
    
    wo = WorkOrder(
        tenant_id=current_user.tenant_id,
        title=f"PM: {schedule.title}",
        description=f"Automated PM completion log. Notes: {sign_off.notes or 'None'}",
        status=WorkOrderStatus.completed,
        priority="low",
        asset_id=schedule.asset_id,
        work_order_number=wo_number,
        reported_by_user_id=current_user.id,
        completed_by_user_id=current_user.id,
        completed_at=now,
        completion_notes=sign_off.notes
    )
    db.add(wo)
    
    # 3. Update Schedule
    current_due = schedule.next_due or now
    interval = schedule.frequency_interval
    freq = schedule.frequency_type.lower()
    
    if freq == "days":
        schedule.next_due = current_due + timedelta(days=interval)
    elif freq == "weeks":
        schedule.next_due = current_due + timedelta(weeks=interval)
    elif freq == "months":
        schedule.next_due = current_due + timedelta(days=30 * interval)
    elif freq == "years":
        schedule.next_due = current_due + timedelta(days=365 * interval)
        
    schedule.last_performed = now
    db.add(schedule)
    
    await db.commit()
    await db.refresh(schedule)
    
    return {"message": "PM signed off successfully", "next_due": schedule.next_due}

@router.delete("/{id}")
async def delete_pm_schedule(
    id: UUID4,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Delete a PM schedule.
    """
    from sqlalchemy.future import select
    query = select(PMSchedule).filter(PMSchedule.id == id, PMSchedule.tenant_id == current_user.tenant_id)
    result = await db.execute(query)
    schedule = result.scalars().first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    await db.delete(schedule)
    await db.commit()
    return {"ok": True}
