import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "apps", "legacy-api"))

from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.core.security import get_password_hash
from sqlalchemy import select

from app.db.base import Base
from app.db.session import engine

async def main():
    # ENSURE TABLES EXIST
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        print("Restoring admin@acme.com...")
        
        # 1. Get Tenant
        slug = "acme"
        result = await db.execute(select(Tenant).where(Tenant.slug == slug))
        tenant = result.scalars().first()
        
        if not tenant:
            print(f"Tenant '{slug}' not found! Creating it...")
            tenant = Tenant(name="ACME Industries", slug=slug)
            db.add(tenant)
            await db.commit()
            await db.refresh(tenant)

        # 2. Check/Create User
        email = "admin@acme.com"
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if user:
            print(f"User {email} already exists. Updating password...")
            user.password_hash = get_password_hash("ScrapHand")
            user.role = UserRole.ADMIN
            user.is_active = True
            db.add(user)
        else:
            print(f"Creating new user {email}...")
            user = User(
                email=email,
                full_name="Restored Admin",
                password_hash=get_password_hash("ScrapHand"),
                role=UserRole.ADMIN,
                is_active=True,
                tenant_id=tenant.id
            )
            db.add(user)
        
        await db.commit()
        print("SUCCESS: User restored with password 'ScrapHand'")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
