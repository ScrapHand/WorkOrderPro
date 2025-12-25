
import asyncio
from app.db.session import AsyncSessionLocal
from app import models
from app.core import security
from sqlalchemy.future import select

async def seed_acme():
    async with AsyncSessionLocal() as db:
        print("Checking for ACME tenant...")
        
        # Check Tenant
        result = await db.execute(select(models.Tenant).where(models.Tenant.slug == "acme"))
        tenant = result.scalars().first()
        if not tenant:
            print("Creating 'acme' tenant...")
            tenant = models.Tenant(name="ACME Corp", slug="acme", plan="enterprise")
            db.add(tenant)
            await db.commit()
            await db.refresh(tenant)
            print("✅ ACME Tenant created.")
        else:
            print("ACME Tenant exists.")

        # Check User
        result = await db.execute(select(models.User).where(models.User.email == "admin@acme.com"))
        user = result.scalars().first()
        
        if not user:
            print("Creating admin@acme.com...")
            hashed = security.get_password_hash("password123")
            user = models.User(
                email="admin@acme.com", 
                password_hash=hashed, 
                full_name="ACME Admin", 
                tenant_id=tenant.id, 
                role="admin",
                is_active=True
            )
            db.add(user)
            await db.commit()
            print("✅ User created: admin@acme.com / password123")
        else:
            # Update password
            print("Updating admin@acme.com password...")
            hashed = security.get_password_hash("password123")
            user.password_hash = hashed
            db.add(user)
            await db.commit()
            print("✅ User updated.")

if __name__ == "__main__":
    asyncio.run(seed_acme())
