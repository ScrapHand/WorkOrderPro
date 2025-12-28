from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import models, schemas
from app.api import deps

router = APIRouter()

@router.get("/{key}", response_model=schemas.Page)
async def read_page(
    key: str,
    db: AsyncSession = Depends(deps.get_db),
    current_tenant: models.Tenant = Depends(deps.get_current_tenant),
) -> Any:
    # 1. Try to find tenant-specific page
    result = await db.execute(
        select(models.Page)
        .where(models.Page.tenant_id == current_tenant.id)
        .where(models.Page.key == key)
    )
    page = result.scalars().first()
    
    if page:
        return page
        
    # 2. If not found, look for system default (tenant_id check might need adjustment depending on how we seed defaults)
    # For this MVP, if no page exists, we might return a default mock structured in code or 404
    # Let's return 404 and let frontend use default.
    raise HTTPException(status_code=404, detail="Page not found")

@router.put("/{key}", response_model=schemas.Page)
async def update_page(
    key: str,
    page_in: schemas.PageUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_tenant: models.Tenant = Depends(deps.get_current_tenant),
) -> Any:
    # Check if exists for this tenant
    result = await db.execute(
        select(models.Page)
        .where(models.Page.tenant_id == current_tenant.id)
        .where(models.Page.key == key)
    )
    page = result.scalars().first()
    
    if page:
        # Update
        page.layout_json = page_in.layout_json
    else:
        # Create
        page = models.Page(
            tenant_id=current_tenant.id,
            key=key,
            layout_json=page_in.layout_json
        )
        db.add(page)
        
    await db.commit()
    await db.refresh(page)
    return page
