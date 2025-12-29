from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import models, schemas
from app.api import deps
from app.core import security
import uuid

router = APIRouter()

@router.get("/me", response_model=schemas.User)
async def read_user_me(
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.get("/", response_model=List[schemas.User])
async def read_users(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.require_admin), # ADMIN ONLY
    current_tenant: models.Tenant = Depends(deps.get_current_tenant),
) -> Any:
    """
    Retrieve users.
    """
    if not current_tenant:
        raise HTTPException(status_code=400, detail="Tenant context required")
        
    query = select(models.User).where(models.User.tenant_id == current_tenant.id).offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    return users

@router.post("/", response_model=schemas.User)
async def create_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(deps.require_admin), # ADMIN ONLY
    current_tenant: models.Tenant = Depends(deps.get_current_tenant),
) -> Any:
    """
    Create new user.
    """
    if not current_tenant:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    # Check email uniqueness in tenant
    existing = await db.execute(select(models.User).where(
        models.User.tenant_id == current_tenant.id,
        models.User.email == user_in.email
    ))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="The user with this user name already exists in the system.")
    
    obj_in_data = user_in.dict()
    password = obj_in_data.pop("password")
    hashed_password = security.get_password_hash(password)
    
    db_obj = models.User(
        **obj_in_data,
        password_hash=hashed_password,
        tenant_id=current_tenant.id
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.patch("/{user_id}/role", response_model=schemas.User)
async def update_user_role(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_id: uuid.UUID,
    role: str = Body(..., embed=True), # Expect JSON: { "role": "MANAGER" }
    current_user: models.User = Depends(deps.require_admin), # ADMIN ONLY
    current_tenant: models.Tenant = Depends(deps.get_current_tenant),
) -> Any:
    """
    Update a user's role live.
    """
    if not current_tenant:
        raise HTTPException(status_code=400, detail="Tenant context required")
        
    result = await db.execute(select(models.User).where(
        models.User.id == user_id,
        models.User.tenant_id == current_tenant.id
    ))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate Role Enum
    # Pydantic schema will validate this upstream if we used it, but here we take raw body.
    # Let's trust logic or rely on DB constraint.
    # Note: UserRole is Enum now.
    
    # Map string to Enum (throws ValueError if invalid)
    try:
        enum_role = models.UserRole(role)
    except ValueError:
         raise HTTPException(status_code=400, detail="Invalid Role")

    user.role = enum_role
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.put("/{user_id}", response_model=schemas.User)
async def update_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_id: uuid.UUID,
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(deps.require_admin), # ADMIN ONLY
    current_tenant: models.Tenant = Depends(deps.get_current_tenant),
) -> Any:
    """
    Update a user.
    """
    if not current_tenant:
        raise HTTPException(status_code=400, detail="Tenant context required")
        
    result = await db.execute(select(models.User).where(
        models.User.id == user_id,
        models.User.tenant_id == current_tenant.id
    ))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_in.dict(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        password = update_data.pop("password")
        hashed_password = security.get_password_hash(password)
        user.password_hash = hashed_password
        
    for field, value in update_data.items():
        setattr(user, field, value)
        
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/{user_id}")
async def delete_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_id: uuid.UUID,
    current_user: models.User = Depends(deps.require_admin), # ADMIN ONLY
    current_tenant: models.Tenant = Depends(deps.get_current_tenant),
) -> Any:
    """
    Delete a user.
    """
    if not current_tenant:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    # Prevent self-delete
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")
        
    result = await db.execute(select(models.User).where(
        models.User.id == user_id,
        models.User.tenant_id == current_tenant.id
    ))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Manually cleanup Foreign Key references to avoid IntegrityError
    # We must nullify references in other tables before deleting the user
    from sqlalchemy import update, delete

    # 1. Nullify WorkOrder references
    await db.execute(update(models.WorkOrder).where(models.WorkOrder.reported_by_user_id == user_id).values(reported_by_user_id=None))
    await db.execute(update(models.WorkOrder).where(models.WorkOrder.assigned_to_user_id == user_id).values(assigned_to_user_id=None))
    await db.execute(update(models.WorkOrder).where(models.WorkOrder.completed_by_user_id == user_id).values(completed_by_user_id=None))

    # 2. Nullify PMSchedule references
    await db.execute(update(models.PMSchedule).where(models.PMSchedule.assigned_to_user_id == user_id).values(assigned_to_user_id=None))

    # 3. Nullify PMLog references
    await db.execute(update(models.PMLog).where(models.PMLog.completed_by_user_id == user_id).values(completed_by_user_id=None))

    # 4. Delete WorkOrderSessions (Non-nullable foreign key)
    await db.execute(delete(models.WorkOrderSession).where(models.WorkOrderSession.user_id == user_id))
        
    await db.delete(user)
    await db.commit()
    
    # Return 204 No Content (Standard for DELETE)
    # Prevents serialization issues with deleted objects
    from fastapi import Response, status
    return Response(status_code=status.HTTP_204_NO_CONTENT)
