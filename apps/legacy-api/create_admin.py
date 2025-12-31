import asyncio
import sys
import os

# Ensure we can import 'app'
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.models import User, UserRole, Tenant
from app.core.security import get_password_hash
from sqlalchemy import select

async def create_admin():
    async with AsyncSessionLocal() as db:
        print("Checking for existing admin...")
        admin_email = "admin@example.com"
        
        # Check Tenant
        stmt_tenant = select(Tenant).where(Tenant.slug == "default")
        result_tenant = await db.execute(stmt_tenant)
        tenant = result_tenant.scalars().first()
        
        if not tenant:
            print("Creating default tenant...")
            tenant = Tenant(name="Default Company", slug="default", plan="enterprise")
            db.add(tenant)
            await db.commit()
            await db.refresh(tenant)
        
        # Check User
        stmt = select(User).where(User.email == admin_email)
        result = await db.execute(stmt)
        existing_user = result.scalars().first()
        
        hashed_pass = get_password_hash("admin123")
        
        if existing_user:
            print(f"Updating existing admin {admin_email}...")
            existing_user.role = UserRole.ADMIN
            existing_user.password_hash = hashed_pass
            # Ensure tenant link
            existing_user.tenant_id = tenant.id
        else:
            print(f"Creating new admin {admin_email}...")
            new_admin = User(
                email=admin_email, 
                password_hash=hashed_pass, 
                role=UserRole.ADMIN, 
                is_active=True,
                full_name="System Admin",
                tenant_id=tenant.id
            )
            db.add(new_admin)
            
        await db.commit()
        print("Admin 'admin@example.com' with password 'admin123' is ready.")

if __name__ == "__main__":
    asyncio.run(create_admin())
