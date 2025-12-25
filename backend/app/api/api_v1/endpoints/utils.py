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
