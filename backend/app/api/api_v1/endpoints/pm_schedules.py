from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.core import PMSchedule, Asset
from pydantic import BaseModel, UUID4
from datetime import datetime

router = APIRouter()

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

@router.post("/{id}/sign-off")
async def sign_off_pm(
    id: UUID4,
    notes: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Sign off a PM schedule directly. 
    Increments next_due and logs the completion.
    """
    from sqlalchemy.future import select
    from app.models.core import PMLog
    from datetime import timedelta
    
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
        notes=notes
    )
    db.add(log)
    
    # 2. Update Schedule
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
