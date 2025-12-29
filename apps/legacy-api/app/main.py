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
        "http://127.0.0.1:3000",
        "https://workorderpro.vercel.app",
        "https://work-order-pro.vercel.app", 
        "https://workorderpro-frontend.vercel.app",
    ],
    allow_origin_regex=r"https://work-order-.*-scraphands-projects\.vercel\.app",
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

@app.get("/")
def root():
    return {"message": "Welcome to Work Order Pro API"}

