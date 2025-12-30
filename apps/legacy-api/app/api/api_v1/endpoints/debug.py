from typing import Any, List
from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app import models, schemas
from app.db.session import get_db

router = APIRouter()

@router.get("/health", response_model=Any)
async def health_check(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Full-Stack Health Check Endpoint
    1. Database Connection & Tenant Check
    2. Admin User Audit
    3. Env & CORS Verification
    """
    report = {
        "status": "unknown",
        "database": {"connected": False, "tenants": [], "error": None},
        "admin_user": {"exists": False, "details": None},
        "cors_debug": {
            "origin": request.headers.get("origin"),
            "host": request.headers.get("host"),
            "user_agent": request.headers.get("user-agent"),
        }
    }

    # 1. Database Check
    try:
        # Simple query to check connection
        await db.execute(text("SELECT 1"))
        report["database"]["connected"] = True
        
        # Tenant Check
        result = await db.execute(select(models.Tenant))
        tenants = result.scalars().all()
        report["database"]["tenants"] = [
            {"id": str(t.id), "name": t.name, "slug": t.slug} for t in tenants
        ]
        
    except Exception as e:
        report["database"]["error"] = str(e)
        report["status"] = "critical_failure"
        return report

    # 2. Admin User Audit
    try:
        stmt = select(models.User).where(models.User.email == "admin@example.com")
        result = await db.execute(stmt)
        user = result.scalars().first()
        
        if user:
            report["admin_user"]["exists"] = True
            report["admin_user"]["details"] = {
                "id": str(user.id),
                "role": user.role,
                "tenant_id": str(user.tenant_id) if user.tenant_id else None,
                "is_active": user.is_active
            }
            
            # Warn if tenant mismatch
            tenant_ids = [t["id"] for t in report["database"]["tenants"]]
            if user.tenant_id and str(user.tenant_id) not in tenant_ids:
                 report["admin_user"]["warning"] = "User linked to non-existent tenant!"
                 
    except Exception as e:
        report["admin_user"]["error"] = str(e)

    # Final Status Determination
    if report["database"]["connected"] and report["admin_user"]["exists"]:
        report["status"] = "healthy"
    else:
        report["status"] = "degraded"

    return report
