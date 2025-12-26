from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.core import PMSchedule, Asset, WorkOrder, WorkOrderStatus, PMLog
from pydantic import BaseModel, UUID4
from datetime import datetime, timedelta
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
import random
import string

router = APIRouter()

class PMSignOff(BaseModel):
    notes: Optional[str] = None

@router.post("/process-due")
async def process_due_pms(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Check all active PM schedules and generate work orders if next_due is reached.
    """
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
        
        # Push next due away
        interval = schedule.frequency_interval
        freq = schedule.frequency_type.lower()
        
        # If next_due is already in the past, keep adding interval until it's in the future
        # to avoid infinite loops if it's very old, but for now just one jump is standard.
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
    # Ensure next_due is set to now if missing
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
