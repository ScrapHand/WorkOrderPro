
import asyncio
from app import models, schemas
from app.core import security
from app.db.session import AsyncSessionLocal
from sqlalchemy.future import select

async def debug_create():
    print("DEBUG: Starting standalone user creation test...")
    
    # Mock data
    user_in = schemas.UserCreate(
        email="debug@example.com",
        password="password123", 
        full_name="Debug User",
        role="viewer"
    )
    
    print(f"DEBUG: UserIn: {user_in}")
    
    obj_in_data = user_in.dict()
    print(f"DEBUG: Dict: {obj_in_data}")
    
    password = obj_in_data.pop("password")
    print(f"DEBUG: Password popped: {password}")
    
    try:
        hashed_password = security.get_password_hash(password)
        print(f"DEBUG: Hashed: {hashed_password[:10]}...")
    except Exception as e:
        print(f"ERROR: Hashing failed: {e}")
        return

    # Database
    async with AsyncSessionLocal() as db:
        # Get Tenant
        result = await db.execute(select(models.Tenant).where(models.Tenant.slug == "demo"))
        tenant = result.scalars().first()
        if not tenant:
            print("ERROR: Tenant demo not found")
            return
            
        print(f"DEBUG: Tenant ID: {tenant.id}")
        
        try:
            db_obj = models.User(
                **obj_in_data,
                password_hash=hashed_password,
                tenant_id=tenant.id
            )
            print(f"DEBUG: DB Obj created: {db_obj}")
            
            db.add(db_obj)
            print("DEBUG: Added to session")
            
            await db.commit()
            print("DEBUG: Committed")
            
            await db.refresh(db_obj)
            print(f"DEBUG: Refreshed. ID: {db_obj.id}")
            
        except Exception as e:
            print(f"ERROR: DB Operation failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_create())
