import asyncio
import sys
import os

# Adapt path to allow imports from app
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.models import User, UserRole, Tenant
from app.core.security import get_password_hash
from sqlalchemy import select

async def emergency_repair():
    async with AsyncSessionLocal() as db:
        print("REPAIR: Starting Emergency Repair...")
        
        # 1. Tenant Check/Fix
        stmt_tenant = select(Tenant).where(Tenant.slug == "default")
        res_tenant = await db.execute(stmt_tenant)
        tenant = res_tenant.scalars().first()
        
        if not tenant:
             print("REPAIR: No 'default' tenant found. Creating 'Acme Corp'...")
             tenant = Tenant(name="Acme Corp", slug="default", plan="enterprise")
             db.add(tenant)
             await db.commit()
             await db.refresh(tenant)
             print(f"REPAIR: Created Tenant ID: {tenant.id}")
        else:
            print(f"REPAIR: Found existing tenant: {tenant.name} ({tenant.id})")
        
        # 2. Admin User Fix
        email = "admin@example.com"
        password = "admin123"
        hashed_pw = get_password_hash(password)
        
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        user = result.scalars().first()
        
        if user:
            print(f"REPAIR: Found Admin ({user.id}). Enforcing state...")
            user.password_hash = hashed_pw
            user.role = UserRole.ADMIN
            
            # CRITICAL CHECK
            if user.tenant_id != tenant.id:
                print(f"REPAIR: FIXING TENANT MISMATCH. Old: {user.tenant_id} -> New: {tenant.id}")
                user.tenant_id = tenant.id
            
            user.is_active = True
        else:
             print(f"REPAIR: Admin missing. Creating new...")
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
        print(f"REPAIR: SUCCESS. Admin login: {email} / {password}")

if __name__ == "__main__":
    try:
        asyncio.run(emergency_repair())
    except Exception as e:
        print(f"FATAL ERROR: {e}")
