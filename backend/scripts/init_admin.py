import sys
import os
import asyncio
from pathlib import Path
from sqlalchemy.future import select

# Add path
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent.parent
legacy_api_path = project_root / "apps" / "legacy-api"
sys.path.append(str(legacy_api_path))

try:
    from app.db.session import AsyncSessionLocal
    from app.models.user import User, UserRole
    from app.models.tenant import Tenant
    from passlib.hash import bcrypt
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)

async def init_admin():
    async with AsyncSessionLocal() as session:
        try:
            print("Session started.")
            # 1. Get Tenant
            # query(Tenant).first() -> select(Tenant).limit(1)
            result = await session.execute(select(Tenant).limit(1))
            tenant = result.scalars().first()

            if not tenant:
                print("No tenants found. Creating 'Demo Company'...")
                import uuid
                tenant = Tenant(name="Demo Company", slug="demo", id=uuid.uuid4())
                session.add(tenant)
                await session.commit()
                await session.refresh(tenant)
                print(f"Created tenant: {tenant.name} ({tenant.id})")
            else:
                print(f"Found tenant: {tenant.name} ({tenant.id})")

            # 2. Key Details
            email = "admin@example.com"
            password = "admin123"
            hashed_password = bcrypt.hash(password)
            role = UserRole.ADMIN

            # 3. Check for User
            result = await session.execute(select(User).filter(User.email == email))
            user = result.scalars().first()

            if user:
                print(f"User {email} found. Updating...")
                user.password_hash = hashed_password
                user.role = role
                if not user.tenant_id:
                    user.tenant_id = tenant.id
                session.add(user)
                print("User updated.")
            else:
                print(f"User {email} not found. Creating...")
                user = User(
                    email=email,
                    password_hash=hashed_password,
                    role=role,
                    tenant_id=tenant.id,
                    full_name="System Admin",
                    is_active=True
                )
                session.add(user)
                print("User created.")

            await session.commit()
            print("Done.")

        except Exception as e:
            await session.rollback()
            print(f"An error occurred: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(init_admin())
