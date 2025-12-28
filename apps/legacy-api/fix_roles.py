import asyncio
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.user import User, UserRole

async def fix_admin():
    async with async_session_factory() as db:
        # Find admin user
        result = await db.execute(select(User).where(User.email.like("admin%")))
        users = result.scalars().all()
        
        for user in users:
            print(f"Found user: {user.email}, Current Role: {user.role}")
            # Force update
            user.role = UserRole.ADMIN
            db.add(user)
            print(f"Updated {user.email} to {UserRole.ADMIN.value}")
            
        await db.commit()
        print("Done.")

if __name__ == "__main__":
    asyncio.run(fix_admin())
