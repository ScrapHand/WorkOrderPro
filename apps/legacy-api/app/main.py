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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001",
        "https://workorderpro.vercel.app",
        "https://work-order-pro.vercel.app", # User's specific URL
        "https://workorderpro-frontend.vercel.app",
    ],
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
    
    # Urgent Seed
    from app.db.session import AsyncSessionLocal
    from sqlalchemy.future import select
    from app import models
    from app.core import security
    
    async with AsyncSessionLocal() as db:
        try:
            # Demo
            res = await db.execute(select(models.Tenant).where(models.Tenant.slug == "demo"))
            demo = res.scalars().first()
            if not demo:
                demo = models.Tenant(name="Demo", slug="demo")
                db.add(demo)
                await db.flush()
            
            # Acme
            res = await db.execute(select(models.Tenant).where(models.Tenant.slug == "acme"))
            acme = res.scalars().first()
            if not acme:
                acme = models.Tenant(name="ACME", slug="acme")
                db.add(acme)
                await db.flush()
            
            # Acme Admin
            res = await db.execute(select(models.User).where(models.User.email == "admin@acme.com"))
            if not res.scalars().first():
                user = models.User(email="admin@acme.com", password_hash=security.get_password_hash("ScrapHand"), 
                                   full_name="Acme Admin", tenant_id=acme.id, role="admin", is_active=True)
                db.add(user)
            
            # Demo Admin
            res = await db.execute(select(models.User).where(models.User.email == "admin@demo.com"))
            if not res.scalars().first():
                user = models.User(email="admin@demo.com", password_hash=security.get_password_hash("ScrapHand"), 
                                   full_name="Demo Admin", tenant_id=demo.id, role="admin", is_active=True)
                db.add(user)

            # ACME Manager (For Role Testing)
            res = await db.execute(select(models.User).where(models.User.email == "manager@acme.com"))
            if not res.scalars().first():
                user = models.User(email="manager@acme.com", password_hash=security.get_password_hash("ScrapHand"), 
                                   full_name="Acme Manager", tenant_id=acme.id, role="manager", is_active=True)
                db.add(user)
            
            # ACME Engineer (For Role Testing)
            res = await db.execute(select(models.User).where(models.User.email == "engineer@acme.com"))
            if not res.scalars().first():
                user = models.User(email="engineer@acme.com", password_hash=security.get_password_hash("ScrapHand"), 
                                   full_name="Acme Engineer", tenant_id=acme.id, role="engineer", is_active=True)
                db.add(user)
            
            await db.commit()
        except Exception as e:
            print(f"Seed failed: {e}")
            await db.rollback()

app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount static files
# Mount static files
# Ensure directory exists so mount doesn't fail or get skipped
if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def root():
    return {"message": "Welcome to Work Order Pro API"}

