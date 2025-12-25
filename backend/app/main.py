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
# Must be added BEFORE routes/mounts to ensure it wraps them
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "*"
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
    
    # Seed default tenant if not exists
    from app.db.session import AsyncSessionLocal
    from sqlalchemy.future import select
    from app import models
    
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(models.Tenant).where(models.Tenant.slug == "demo"))
            tenant = result.scalars().first()
            if not tenant:
                # Create demo tenant
                tenant = models.Tenant(name="Demo Company", slug="demo", plan="enterprise")
                db.add(tenant)
                await db.flush() # Ensure ID is available
                print("Seeded 'demo' tenant.")
            
            # Ensure admin user exists
            user_res = await db.execute(select(models.User).where(models.User.email == "admin@demo.com"))
            user = user_res.scalars().first()
            
            if not user:
                from app.core import security
                hashed = security.get_password_hash("password")
                user = models.User(email="admin@demo.com", password_hash=hashed, full_name="Admin User", tenant_id=tenant.id, role="admin", is_active=True)
                db.add(user)
                print("Seeded 'admin@demo.com' user.")
                
            await db.commit()
        except Exception as e:
            print(f"Seeding failed: {e}")
        finally:
            await db.close()

app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount static files
# Duplicate static mount removed
# app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS was moved to top


@app.get("/")
def root():
    return {"message": "Welcome to Work Order Pro API"}

@app.get("/static/{filename:path}")
async def get_static_file(filename: str):
    file_path = os.path.join("static", filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "File not found"}, 404

@app.get("/debug-db")
async def debug_db():
    from app.db.session import AsyncSessionLocal
    from sqlalchemy.future import select
    from app import models
    try:
        async with AsyncSessionLocal() as db:
            tenants_res = await db.execute(select(models.Tenant))
            users_res = await db.execute(select(models.User))
            
            return {
                "status": "ok",
                "tenants": [{"name": t.name, "slug": t.slug, "id": str(t.id)} for t in tenants_res.scalars().all()],
                "users": [{"email": u.email, "tenant_id": str(u.tenant_id)} for u in users_res.scalars().all()]
            }
    except Exception as e:
        return {"status": "error", "detail": str(e)}
