
import asyncio
from app.db.session import AsyncSessionLocal
from app import models
from sqlalchemy.future import select

async def list_tenants():
    async with AsyncSessionLocal() as db:
        print("Listing Tenants:")
        result = await db.execute(select(models.Tenant))
        tenants = result.scalars().all()
        for t in tenants:
            print(f"- {t.name} (slug: {t.slug}) ID: {t.id}")
        
        if not tenants:
            print("No tenants found.")

if __name__ == "__main__":
    asyncio.run(list_tenants())
