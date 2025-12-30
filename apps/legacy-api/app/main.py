from fastapi import FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.api.api_v1.api import api_router
from app import models # Ensure models are loaded for create_all

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Logging Middleware
from fastapi import Request
import logging

@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Basic request logging
    print(f"Incoming Request: {request.method} {request.url.path}")
    response = await call_next(request)
    print(f"Response Status: {response.status_code}")
    return response

# Set all CORS enabled origins
# Custom CORS Middleware for Vercel Previews
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import re

# Standard CORS Middleware with Regex Support
# Replaces custom implementation for better stability
allowed_origins = [
    "http://localhost:3000", 
    "http://localhost:3001",
    "https://workorderpro.vercel.app",
]

# Regex matches any sub-domain deployment on Vercel
# e.g. https://work-order-1simgotp2-scraphands-projects.vercel.app
allow_origin_regex = r"https://work-order-.*-scraphands-projects\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
) 


# Mount static files
# app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Run Seeder
    from app.db.session import AsyncSessionLocal
    from app.db.init_db import init_db
    
    async with AsyncSessionLocal() as db:
        try:
            # AUTO-MIGRATION: Fix Remote DB Roles to Lowercase
            # This ensures compatibility with strict Enum handling
            from sqlalchemy import text
            await db.execute(text("UPDATE users SET role = lower(role)"))
            await db.execute(text("UPDATE work_orders SET status = lower(status)"))
            await db.commit()
            
            # await init_db(db) # Keep original seeding disabled for now
            pass
            # await init_db(db)
        except Exception as e:
            print(f"Seed failed: {e}")

app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount static files
# Mount static files
# Ensure directory exists so mount doesn't fail or get skipped
if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

from fastapi.responses import JSONResponse
@app.exception_handler(Exception)
async def debug_exception_handler(request: Request, exc: Exception):
    import traceback
    import sys
    print(f"DEBUG EXCEPTION CAUGHT: {exc}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    sys.stderr.flush()
    return JSONResponse(
        status_code=500,
        content={"message": f"Debug Error: {exc}"},
    )

@app.get("/version")
async def read_version():
    return {"version": "2.0.4", "feature": "standard_cors_secure_cookie", "timestamp": "2025-12-30T17:45:00Z"}

@app.get("/")
def root():
    return {"message": "Welcome to Work Order Pro API"}

# TEMPORARY: Master Key for Admin Setup
@app.get("/setup-admin")
async def setup_admin():
    from app.db.session import AsyncSessionLocal
    from app.core import security
    from sqlalchemy import select
    
    async with AsyncSessionLocal() as db:
        # Check if admin exists
        stmt = select(models.User).where(models.User.email == "admin@example.com")
        result = await db.execute(stmt)
        user = result.scalars().first()
        
        hashed_pw = security.get_password_hash("ScrapHand")
        
        if user:
            user.password_hash = hashed_pw
            user.role = models.UserRole.ADMIN
            user.full_name = "System Admin"
            msg = "Admin user updated."
        else:
            # We need a tenant first? Assuming one exists or creating one.
            # Realistically, for this hack, lets just find the first tenant.
            stmt_tenant = select(models.Tenant)
            res_tenant = await db.execute(stmt_tenant)
            tenant = res_tenant.scalars().first()
            if not tenant:
                tenant = models.Tenant(name="Default Corp", slug="default", plan="enterprise")
                db.add(tenant)
                await db.commit()
                await db.refresh(tenant)
                
            user = models.User(
                email="admin@example.com",
                password_hash=hashed_pw,
                full_name="System Admin",
                role=models.UserRole.ADMIN,
                tenant_id=tenant.id,
                is_active=True
            )
            db.add(user)
            msg = "Admin user created."
            
        await db.commit()
        return {"message": msg, "credentials": {"email": "admin@example.com", "password": "ScrapHand"}}

# TEMPORARY: Fix Tenant
@app.get("/fix-tenant")
async def fix_tenant():
    from app.db.session import AsyncSessionLocal
    from sqlalchemy import select
    
    async with AsyncSessionLocal() as db:
        stmt = select(models.Tenant).where(models.Tenant.slug == "default")
        result = await db.execute(stmt)
        tenant = result.scalars().first()
        
        if tenant:
            return {"message": "Tenant 'default' already exists.", "tenant_id": str(tenant.id)}
            
        tenant = models.Tenant(
            name="Default Company",
            slug="default",
            primary_domain="workorderpro.onrender.com",
            plan="enterprise"
        )
        db.add(tenant)
        await db.commit()
        await db.refresh(tenant)
        return {"message": "Tenant 'default' created successfully.", "tenant_id": str(tenant.id)}
