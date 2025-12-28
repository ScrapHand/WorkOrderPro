from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.core import InventoryItem
from pydantic import BaseModel, UUID4
from datetime import datetime

router = APIRouter()

class InventoryItemBase(BaseModel):
    name: str
    sku: Optional[str] = None
    description: Optional[str] = None
    quantity: int = 0
    unit: str = "pcs"
    min_quantity: int = 0
    location: Optional[str] = None
    category: Optional[str] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(InventoryItemBase):
    name: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None

class InventoryItemOut(InventoryItemBase):
    id: UUID4
    tenant_id: UUID4
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

@router.get("/", response_model=List[InventoryItemOut])
async def read_inventory(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve inventory items for the current tenant.
    """
    from sqlalchemy.future import select
    query = select(InventoryItem).filter(InventoryItem.tenant_id == current_user.tenant_id).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=InventoryItemOut)
async def create_inventory_item(
    item_in: InventoryItemCreate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Create new inventory item.
    """
    item = InventoryItem(
        **item_in.dict(),
        tenant_id=current_user.tenant_id
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.get("/{id}", response_model=InventoryItemOut)
async def read_inventory_item(
    id: UUID4,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Get inventory item by ID.
    """
    from sqlalchemy.future import select
    query = select(InventoryItem).filter(InventoryItem.id == id, InventoryItem.tenant_id == current_user.tenant_id)
    result = await db.execute(query)
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.put("/{id}", response_model=InventoryItemOut)
async def update_inventory_item(
    id: UUID4,
    item_in: InventoryItemUpdate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Update an inventory item.
    """
    from sqlalchemy.future import select
    query = select(InventoryItem).filter(InventoryItem.id == id, InventoryItem.tenant_id == current_user.tenant_id)
    result = await db.execute(query)
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
        
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/{id}")
async def delete_inventory_item(
    id: UUID4,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Delete an inventory item.
    """
    from sqlalchemy.future import select
    query = select(InventoryItem).filter(InventoryItem.id == id, InventoryItem.tenant_id == current_user.tenant_id)
    result = await db.execute(query)
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    await db.delete(item)
    await db.commit()
    return {"ok": True}
