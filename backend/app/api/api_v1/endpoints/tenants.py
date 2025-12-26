from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import models, schemas
from app.api import deps
from sqlalchemy.orm.attributes import flag_modified
import uuid

router = APIRouter()

@router.post("/", response_model=schemas.Tenant)
async def create_tenant(
    *,
    db: AsyncSession = Depends(deps.get_db),
    tenant_in: schemas.TenantCreate,
) -> Any:
    # Public endpoint to register a tenant? Or superadmin only?
    # Let's allow public for "Sign Up".
    
    # Check slug uniqueness
    existing = await db.execute(select(models.Tenant).where(models.Tenant.slug == tenant_in.slug))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Tenant slug already exists")
    
    tenant = models.Tenant(**tenant_in.dict())
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    return tenant

@router.get("/me", response_model=schemas.Tenant)
async def read_current_tenant(
    current_tenant: models.Tenant = Depends(deps.get_current_tenant),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    # Extract theme_json from relationship OR query directly for robustness
    theme_json = {}
    
    # Try direct query to be 100% sure we get data vs ORM loading
    result = await db.execute(select(models.TenantTheme).where(models.TenantTheme.tenant_id == current_tenant.id))
    theme_obj = result.scalars().first()
    
    if theme_obj:
        theme_json = theme_obj.theme_json or {}
    elif current_tenant.theme:
        theme_json = current_tenant.theme.theme_json or {}
    
    # Create response dict with only the fields Pydantic expects
    return {
        "id": current_tenant.id,
        "name": current_tenant.name,
        "slug": current_tenant.slug,
        "primary_domain": current_tenant.primary_domain,
        "theme_json": theme_json
    }

@router.put("/theme", response_model=dict)
async def update_tenant_theme(
    *,
    db: AsyncSession = Depends(deps.get_db),
    theme_in: schemas.TenantThemeUpdate,
    current_tenant: models.Tenant = Depends(deps.get_current_tenant),
    # current_user: models.User = Depends(deps.get_current_active_admin) # TODO: Permission check
) -> Any:
    # Find existing theme or create
    print(f"DEBUG: Updating theme for tenant {current_tenant.slug} ({current_tenant.id})")
    print(f"DEBUG: Payload - Colors: {theme_in.colors}, Branding: {theme_in.branding}")
    
    result = await db.execute(select(models.TenantTheme).where(models.TenantTheme.tenant_id == current_tenant.id))
    theme_obj = result.scalars().first()
    
    if theme_obj:
        # Update
        # Create a FRESH copy of the dictionary to ensure mutation is tracked
        current_data = dict(theme_obj.theme_json or {})
        
        if theme_in.colors:
            current_data["colors"] = theme_in.colors
        if theme_in.branding:
             current_data["branding"] = theme_in.branding
        if theme_in.naming:
             current_data["naming"] = theme_in.naming
             
        theme_obj.theme_json = current_data
        flag_modified(theme_obj, "theme_json") # Force SQLAlchemy to track change
    else:
        new_json = {}
        if theme_in.colors:
            new_json["colors"] = theme_in.colors
        if theme_in.branding:
            new_json["branding"] = theme_in.branding
        if theme_in.naming:
            new_json["naming"] = theme_in.naming
            
        theme_obj = models.TenantTheme(tenant_id=current_tenant.id, theme_json=new_json)
        db.add(theme_obj)
    
    await db.commit()
    await db.refresh(theme_obj)
    return theme_obj.theme_json
