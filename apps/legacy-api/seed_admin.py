
import asyncio
from app.db.session import AsyncSessionLocal
from app import models
from app.core import security
from sqlalchemy.future import select

async def seed_admin():
    async with AsyncSessionLocal() as db:
        print("Checking for admin user...")
        
        # Get Tenant
        result = await db.execute(select(models.Tenant).where(models.Tenant.slug == "demo"))
        tenant = result.scalars().first()
        if not tenant:
            print("Error: Demo tenant not found. Please checks DB.")
            return

        # Check User
        result = await db.execute(select(models.User).where(models.User.email == "admin@demo.com"))
        user = result.scalars().first()
        
        if not user:
            print("Creating admin@demo.com...")
            hashed = security.get_password_hash("password123")
            user = models.User(
                email="admin@demo.com", 
                password_hash=hashed, 
                full_name="Admin User", 
                tenant_id=tenant.id, 
                role="admin",
                is_active=True
            )
            db.add(user)
            await db.commit()
            print("✅ Admin user created: admin@demo.com / password123")
        else:
            # Update password just in case
            print("User exists. Resetting password to 'password123'...")
            hashed = security.get_password_hash("password123")
            user.password_hash = hashed
            db.add(user)
            await db.commit()
            print("✅ Admin user verified/updated.")

if __name__ == "__main__":
    asyncio.run(seed_admin())
