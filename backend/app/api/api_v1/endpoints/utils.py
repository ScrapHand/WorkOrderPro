from typing import Any
from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "static"

@router.post("/upload", response_model=dict)
async def upload_file(
    file: UploadFile = File(...),
) -> Any:
    # Ensure directory exists (it should, but safety first)
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
        
    # Generate unique filename to avoid collisions
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not save file")
        
    # Return URL
    # In production, this would be a CDN URL.
    # Here it's relative or absolute path to static mount.
    return {"url": f"/static/{unique_filename}"}

@router.post("/migrate-db", response_model=dict)
async def migrate_db() -> Any:
    """
    Force run database migrations/fixes.
    """
    from app.db.session import AsyncSessionLocal
    from sqlalchemy import text
    
    async with AsyncSessionLocal() as db:
        try:
            # 1. Check/Add work_order_number
            try:
                await db.execute(text("SELECT work_order_number FROM work_orders LIMIT 1"))
                status_wo = "Column 'work_order_number' exists."
            except Exception:
                await db.execute(text("ALTER TABLE work_orders ADD COLUMN work_order_number VARCHAR"))
                await db.commit()
                status_wo = "Column 'work_order_number' ADDED."

            return {
                "status": "Migration Complete",
                "details": {
                    "work_order_number": status_wo,
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Migration Failed: {str(e)}")
