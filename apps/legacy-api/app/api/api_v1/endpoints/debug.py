from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import models
from app.api import deps

router = APIRouter()

@router.get("/db")
async def read_db_state(
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    DEBUG: Dump all tenants and users to verify seeding.
    """
    # Tenants
    t_result = await db.execute(select(models.Tenant))
    tenants = t_result.scalars().all()
    
    # Users
    u_result = await db.execute(select(models.User))
    users = u_result.scalars().all()
    
    return {
        "tenants": [{"id": t.id, "name": t.name, "slug": t.slug} for t in tenants],
        "users": [{"email": u.email, "role": u.role, "tenant_id": u.tenant_id} for u in users],
        "count": {
            "tenants": len(tenants),
            "users": len(users)
        }
    }
