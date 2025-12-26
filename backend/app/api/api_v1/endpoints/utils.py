from typing import Any
from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid
from app.core.config import settings

router = APIRouter()

UPLOAD_DIR = "static"

@router.post("/upload", response_model=dict)
async def upload_file(
    file: UploadFile = File(...),
) -> Any:
    # Ensure directory exists
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
        
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not save file")
        
    return {"url": f"/static/{unique_filename}"}

@router.post("/migrate-db", response_model=dict)
async def migrate_db() -> Any:
    """
    Force run database migrations/fixes, seed vital data, and report status.
    """
    from app.db.session import AsyncSessionLocal
    from sqlalchemy import text
    from sqlalchemy.future import select
    from app import models
    from app.core import security
    
    report = {}
    async with AsyncSessionLocal() as db:
        try:
            # 1. Schema Migration: work_order_number
            try:
                await db.execute(text("SELECT work_order_number FROM work_orders LIMIT 1"))
                report["work_order_number"] = "Exists"
            except Exception:
                await db.execute(text("ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS work_order_number VARCHAR"))
                await db.commit()
                report["work_order_number"] = "Added"

            # 2. Tenant Seeding
            required_tenants = [("demo", "Demo Company"), ("acme", "ACME Corp")]
            for slug, name in required_tenants:
                res = await db.execute(select(models.Tenant).where(models.Tenant.slug == slug))
                tenant = res.scalars().first()
                if not tenant:
                    tenant = models.Tenant(name=name, slug=slug, plan="enterprise")
                    db.add(tenant)
                    await db.flush()
                    report[f"tenant_{slug}"] = "Created"
                else:
                    report[f"tenant_{slug}"] = "Exists"
                
                # 3. User Seeding for this tenant
                email = f"admin@{slug}.com"
                user_res = await db.execute(select(models.User).where(models.User.email == email))
                user = user_res.scalars().first()
                if not user:
                    hashed = security.get_password_hash("password")
                    user = models.User(
                        email=email, 
                        password_hash=hashed, 
                        full_name=f"{slug.capitalize()} Admin", 
                        tenant_id=tenant.id, 
                        role="admin", 
                        is_active=True
                    )
                    db.add(user)
                    report[f"user_{slug}"] = "Created"
                else:
                    # Force password reset to ensure it's 'password' for debugging
                    hashed = security.get_password_hash("password")
                    user.password_hash = hashed
                    db.add(user)
                    report[f"user_{slug}"] = "Password Reset (to 'password')"
            
            await db.commit()

            # 4. Final Counts
            tenant_count = (await db.execute(text("SELECT count(*) FROM tenants"))).scalar()
            user_count = (await db.execute(text("SELECT count(*) FROM users"))).scalar()
            
            db_uri = settings.SQLALCHEMY_DATABASE_URI
            db_type = "Postgres" if "postgresql" in db_uri else "SQLite" if "sqlite" in db_uri else "Unknown"
            
            return {
                "status": "Success",
                "database_type": db_type,
                "counts": {"tenants": tenant_count, "users": user_count},
                "report": report
            }
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=500, detail=f"DR Failure: {str(e)}")
