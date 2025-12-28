"""
Test the tenant endpoint directly to see the actual error
"""
import asyncio
import sys
sys.path.insert(0, '.')

from app.api.api_v1.endpoints.tenants import read_current_tenant
from app.db.session import AsyncSessionLocal
from app import models
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

async def test():
    async with AsyncSessionLocal() as db:
        try:
            # Get tenant
            result = await db.execute(
                select(models.Tenant)
                .options(selectinload(models.Tenant.theme))
                .where(models.Tenant.slug == "demo")
            )
            tenant = result.scalars().first()
            
            print(f"Tenant: {tenant.name}")
            print(f"Tenant ID type: {type(tenant.id)}")
            print(f"Theme: {tenant.theme}")
            
            # Try calling the endpoint function
            result = await read_current_tenant(current_tenant=tenant, db=db)
            print(f"Success! Result: {result}")
            
        except Exception as e:
            print(f"ERROR: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
