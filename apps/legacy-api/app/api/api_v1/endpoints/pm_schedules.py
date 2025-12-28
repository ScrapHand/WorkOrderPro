from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.core import PMSchedule, Asset, PMLog
from pydantic import BaseModel, UUID4
from datetime import datetime, timedelta
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

router = APIRouter()

class PMSignOff(BaseModel):
    notes: Optional[str] = None

class PMScheduleBase(BaseModel):
    title: str
    description: Optional[str] = None
    frequency_type: str = "days" # daily, weekly, fortnightly, monthly, quarterly, 6 monthly, yearly
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
    last_performed: Optional[datetime] = None
    asset: Optional[AssetSimpleOut] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[PMScheduleOut])
async def read_pm_schedules(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
):
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
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    data = schedule_in.dict()
    if not data.get('next_due'):
        data['next_due'] = datetime.utcnow()
        
    schedule = PMSchedule(
        **data,
        tenant_id=current_user.tenant_id
    )
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    return schedule

@router.get("/{id}", response_model=PMScheduleOut)
async def read_pm_schedule(
    id: UUID4,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
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
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
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

def calculate_next_due(current_due: datetime, freq: str, interval: int = 1) -> datetime:
    f = freq.lower()
    if f == "daily":
        return current_due + timedelta(days=1)
    elif f == "weekly":
        return current_due + timedelta(weeks=1)
    elif f == "fortnightly":
        return current_due + timedelta(weeks=2)
    elif f == "monthly":
        return current_due + timedelta(days=30)
    elif f == "quarterly":
        return current_due + timedelta(days=91)
    elif f == "6 monthly":
        return current_due + timedelta(days=182)
    elif f == "yearly":
        return current_due + timedelta(days=365)
    # Fallback to old dynamic interval if none of the above match
    if f == "days":
        return current_due + timedelta(days=interval)
    elif f == "weeks":
        return current_due + timedelta(weeks=interval)
    elif f == "months":
        return current_due + timedelta(days=30 * interval)
    elif f == "years":
        return current_due + timedelta(days=365 * interval)
    return current_due + timedelta(days=interval)

@router.post("/{id}/sign-off")
async def sign_off_pm(
    id: UUID4,
    sign_off: PMSignOff,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
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
    
    # 2. Update Schedule
    current_due = schedule.next_due or now
    schedule.next_due = calculate_next_due(current_due, schedule.frequency_type, schedule.frequency_interval)
    schedule.last_performed = now
    db.add(schedule)
    
    await db.commit()
    await db.refresh(schedule)
    
    return {"message": "PM signed off successfully", "next_due": schedule.next_due}

@router.delete("/{id}")
async def delete_pm_schedule(
    id: UUID4,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    query = select(PMSchedule).filter(PMSchedule.id == id, PMSchedule.tenant_id == current_user.tenant_id)
    result = await db.execute(query)
    schedule = result.scalars().first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    await db.delete(schedule)
    await db.commit()
    return {"ok": True}
