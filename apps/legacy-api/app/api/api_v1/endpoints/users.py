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
    current_user: models.User = Depends(deps.get_current_admin), # ADMIN ONLY
    current_tenant: models.Tenant = Depends(deps.get_current_tenant),
) -> Any:
    """
    Retrieve users.
    """
    if not current_tenant:
        raise HTTPException(status_code=400, detail="Tenant context required")
        
    query = select(models.User).where(models.User.tenant_id == current_tenant.id).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=schemas.User)
async def create_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(deps.get_current_admin), # ADMIN ONLY
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
    current_user: models.User = Depends(deps.get_current_admin), # ADMIN ONLY
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
    if role not in ["ADMIN", "MANAGER", "TECHNICIAN", "admin", "manager", "engineer", "viewer", "team_leader"]:
        raise HTTPException(status_code=400, detail="Invalid Role")

    user.role = role
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
    current_user: models.User = Depends(deps.get_current_admin), # ADMIN ONLY
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

@router.delete("/{user_id}", response_model=schemas.User)
async def delete_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_admin), # ADMIN ONLY
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
        
    await db.delete(user)
    await db.commit()
    return user
