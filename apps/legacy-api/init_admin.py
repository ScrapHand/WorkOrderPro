import asyncio
import sys
import os

# Adapt path to allow imports from app
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.models import User, UserRole, Tenant
from app.core.security import get_password_hash
from sqlalchemy import select

async def init_admin():
    async with AsyncSessionLocal() as db:
        print("Script: Connecting to DB...")
        
        # 1. Ensure Tenant
        stmt_tenant = select(Tenant).where(Tenant.slug == "default")
        res_tenant = await db.execute(stmt_tenant)
        tenant = res_tenant.scalars().first()
        
        if not tenant:
             print("Script: Creating default tenant...")
             tenant = Tenant(name="Default Company", slug="default", plan="enterprise")
             db.add(tenant)
             await db.commit()
             await db.refresh(tenant)
        
        # 2. Force Admin
        email = "admin@example.com"
        password = "admin123"
        hashed_pw = get_password_hash(password)
        
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        user = result.scalars().first()
        
        if user:
            print(f"Script: Found {email}. Updating password and role...")
            user.password_hash = hashed_pw
            user.role = UserRole.ADMIN
            user.tenant_id = tenant.id
            user.is_active = True
        else:
             print(f"Script: Creating {email}...")
             user = User(
                email=email, 
                password_hash=hashed_pw, 
                role=UserRole.ADMIN, 
                is_active=True,
                full_name="System Admin",
                tenant_id=tenant.id
            )
             db.add(user)
        
        await db.commit()
        print(f"Script: DONE. Admin {email} set to {password}")

if __name__ == "__main__":
    try:
        asyncio.run(init_admin())
    except Exception as e:
        print(f"Error: {e}")
