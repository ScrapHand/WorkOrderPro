import asyncio
from app.db.session import SessionLocal
from app.models.user import User
from app.models.tenant import Tenant
from app.core import security
from sqlalchemy import select
import uuid

async def create_users():
    async with SessionLocal() as db:
        # Get Tenant
        result = await db.execute(select(Tenant).where(Tenant.slug == "demo"))
        tenant = result.scalars().first()
        if not tenant:
            print("Demo tenant not found!")
            return

        users = [
            {"email": "manager@test.com", "role": "manager", "name": "Manager Test"},
            {"email": "engineer@test.com", "role": "engineer", "name": "Engineer Test"}
        ]

        for u in users:
            # Check exist
            result = await db.execute(select(User).where(User.email == u["email"]))
            existing = result.scalars().first()
            if not existing:
                user = User(
                    email=u["email"],
                    password_hash=security.get_password_hash("password"),
                    full_name=u["name"],
                    role=u["role"],
                    tenant_id=tenant.id,
                    is_active=True
                )
                db.add(user)
                print(f"Created {u['email']}")
            else:
                print(f"User {u['email']} already exists")
        
        await db.commit()

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(create_users())
