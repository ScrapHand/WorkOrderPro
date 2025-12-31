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
        
        # Dynamic Lookup for Portability (Local vs Remote)
        stmt_files = text("SELECT id FROM tenants WHERE slug = 'acme'")
        result = await db.execute(stmt_files)
        tenant_id = result.scalars().first()
        
        if not tenant_id:
            print("WARNING: 'acme' tenant not found. Falling back to 'default'.")
            stmt_default = text("SELECT id FROM tenants WHERE slug = 'default'")
            result = await db.execute(stmt_default)
            tenant_id = result.scalars().first()
            
        if not tenant_id:
            print("ERROR: No suitable tenant found!")
            return

        email = 'admin@example.com'
        
        stmt = text("UPDATE users SET tenant_id = :tid WHERE email = :email")
        await db.execute(stmt, {"tid": tenant_id, "email": email})
        await db.commit()
        
        print(f"MIGRATION: SUCCESS. {email} moved to tenant {tenant_id}")

if __name__ == "__main__":
    try:
        asyncio.run(move_admin())
    except Exception as e:
        print(f"FATAL ERROR: {e}")
