from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.core import Asset, AssetStatus
from pydantic import BaseModel, UUID4

router = APIRouter()

class AssetBase(BaseModel):
    name: str
    code: str
    location: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = "Healthy"
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    notes: Optional[str] = None
    technical_specs: Optional[dict] = {}

class AssetCreate(AssetBase):
    pass

class AssetUpdate(AssetBase):
    name: Optional[str] = None
    code: Optional[str] = None

class AssetOut(AssetBase):
    id: UUID4
    tenant_id: UUID4

    class Config:
        from_attributes = True

@router.get("/", response_model=List[AssetOut])
async def read_assets(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve assets for the current tenant.
    """
    from sqlalchemy.future import select
    query = select(Asset).filter(Asset.tenant_id == current_user.tenant_id).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=AssetOut)
async def create_asset(
    asset_in: AssetCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Create new asset.
    """
    asset = Asset(
        **asset_in.dict(),
        tenant_id=current_user.tenant_id
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset

@router.get("/{id}", response_model=AssetOut)
async def read_asset(
    id: UUID4,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Get asset by ID.
    """
    from sqlalchemy.future import select
    query = select(Asset).filter(Asset.id == id, Asset.tenant_id == current_user.tenant_id)
    result = await db.execute(query)
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.put("/{id}", response_model=AssetOut)
async def update_asset(
    id: UUID4,
    asset_in: AssetUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Update an asset.
    """
    from sqlalchemy.future import select
    query = select(Asset).filter(Asset.id == id, Asset.tenant_id == current_user.tenant_id)
    result = await db.execute(query)
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    update_data = asset_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)
        
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset

@router.delete("/{id}")
async def delete_asset(
    id: UUID4,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Delete an asset.
    """
    from sqlalchemy.future import select
    query = select(Asset).filter(Asset.id == id, Asset.tenant_id == current_user.tenant_id)
    result = await db.execute(query)
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    await db.delete(asset)
    await db.commit()
    return {"ok": True}

    return {"ok": True}
