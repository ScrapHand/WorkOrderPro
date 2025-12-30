import asyncio
import sys
import os

# Adapt path to allow imports from app
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.models import User
from sqlalchemy import text

async def move_admin():
    async with AsyncSessionLocal() as db:
        print("MIGRATION: Moving Admin to ACME Corp...")
        
        target_tenant_id = 'e2d4f479-eb56-4ead-a0c9-264b83552fc5'
        email = 'admin@example.com'
        
        # Explicit update as requested
        stmt = text("UPDATE users SET tenant_id = :tid WHERE email = :email")
        await db.execute(stmt, {"tid": target_tenant_id, "email": email})
        await db.commit()
        
        print(f"MIGRATION: SUCCESS. {email} moved to tenant {target_tenant_id}")

if __name__ == "__main__":
    try:
        asyncio.run(move_admin())
    except Exception as e:
        print(f"FATAL ERROR: {e}")
