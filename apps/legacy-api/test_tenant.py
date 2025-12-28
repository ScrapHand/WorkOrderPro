"""
Quick test to see if tenant fetch endpoint works
"""
import asyncio
from app.db.session import AsyncSessionLocal
from app import models
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

async def test():
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(models.Tenant)
                .options(selectinload(models.Tenant.theme))
                .where(models.Tenant.slug == "demo")
            )
            tenant = result.scalars().first()
            
            if tenant:
                print(f"Tenant found: {tenant.name}")
                print(f"Has theme: {tenant.theme is not None}")
                
                # Try to serialize
                tenant_dict = tenant.__dict__.copy()
                if hasattr(tenant, 'theme') and tenant.theme:
                    print(f"Theme JSON: {tenant.theme.theme_json}")
                    tenant_dict['theme_json'] = tenant.theme.theme_json
                else:
                    tenant_dict['theme_json'] = {}
                
                print("Serialization OK")
            else:
                print("Tenant not found")
                
        except Exception as e:
            print(f"Error: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
