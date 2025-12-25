import asyncio
import uuid
from datetime import datetime, timedelta
from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal, engine
from app import models
from app.core import security
from app.db.base import Base

async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        try:
            # 1. Ensure Demo Tenant
            result = await db.execute(select(models.Tenant).where(models.Tenant.slug == "demo"))
            tenant = result.scalars().first()
            if not tenant:
                tenant = models.Tenant(name="Demo Industrial Corp", slug="demo", plan="enterprise")
                db.add(tenant)
                await db.flush()
                print(f"Created tenant: {tenant.name}")
            else:
                tenant.name = "Demo Industrial Corp"
                print(f"Using existing tenant: {tenant.name}")

            # 2. Ensure Admin User
            user_res = await db.execute(select(models.User).where(models.User.email == "admin@demo.com"))
            admin_user = user_res.scalars().first()
            if not admin_user:
                hashed = security.get_password_hash("password")
                admin_user = models.User(
                    email="admin@demo.com", 
                    password_hash=hashed, 
                    full_name="Chief Engineer", 
                    tenant_id=tenant.id, 
                    role="admin", 
                    is_active=True
                )
                db.add(admin_user)
                print("Created admin user.")

            # 3. Add Assets
            assets_data = [
                {"name": "Main HVAC Unit", "code": "HVAC-001", "location": "Roof Sector A", "category": "HVAC", "manufacturer": "Carrier", "model": "WeatherMaker"},
                {"name": "Backup Generator", "code": "GEN-002", "location": "Basement B1", "category": "Electrical", "manufacturer": "Caterpillar", "model": "C175-16"},
                {"name": "Conveyor Belt #4", "code": "CONV-004", "location": "Assembly Line 2", "category": "Production", "manufacturer": "Siemens", "model": "Simogear"},
                {"name": "Forklift Truck", "code": "FL-010", "location": "Warehouse South", "category": "Vehicles", "manufacturer": "Toyota", "model": "8-Series"},
            ]
            
            assets = []
            for a_data in assets_data:
                res = await db.execute(select(models.Asset).where(models.Asset.code == a_data["code"], models.Asset.tenant_id == tenant.id))
                asset = res.scalars().first()
                if not asset:
                    asset = models.Asset(**a_data, tenant_id=tenant.id)
                    db.add(asset)
                    print(f"Added asset: {asset.name}")
                assets.append(asset)
            await db.flush()

            # 4. Add Inventory Items
            inventory_data = [
                {"name": "HEPA Filter 24x24", "sku": "FIL-HP-001", "quantity": 12, "min_quantity": 5, "category": "Filters"},
                {"name": "Synthetic Oil 5W-30", "sku": "OIL-SYN-005", "quantity": 45, "min_quantity": 50, "category": "Lubricants"},
                {"name": "Drive Belt XL", "sku": "BEL-DR-099", "quantity": 3, "min_quantity": 10, "category": "Mechanical"},
                {"name": "LED Panel 2x4", "sku": "LGT-LED-002", "quantity": 120, "min_quantity": 20, "category": "Lighting"},
            ]
            for i_data in inventory_data:
                res = await db.execute(select(models.InventoryItem).where(models.InventoryItem.sku == i_data["sku"], models.InventoryItem.tenant_id == tenant.id))
                item = res.scalars().first()
                if not item:
                    item = models.InventoryItem(**i_data, tenant_id=tenant.id)
                    db.add(item)
                    print(f"Added inventory item: {item.name}")
            
            # 5. Add Work Orders
            now = datetime.utcnow()
            wo_data = [
                {"title": "Quarterly HVAC Maintenance", "description": "Replace filters and check coolant levels.", "status": "completed", "priority": "medium", "asset_id": assets[0].id, "created_at": now - timedelta(days=10)},
                {"title": "Generator Oil Leak", "description": "Small leak detected near the main gasket.", "status": "in_progress", "priority": "high", "asset_id": assets[1].id, "created_at": now - timedelta(days=2)},
                {"title": "Conveyor Belt Tensioning", "description": "Belt #4 is slipping under heavy load.", "status": "new", "priority": "critical", "asset_id": assets[2].id, "created_at": now - timedelta(hours=4)},
                {"title": "Warehouse Lighting Upgrade", "description": "Replace halogen bulbs with LEDs.", "status": "waiting_parts", "priority": "low", "asset_id": None, "created_at": now - timedelta(days=5)},
            ]
            
            for w_data in wo_data:
                res = await db.execute(select(models.WorkOrder).where(models.WorkOrder.title == w_data["title"], models.WorkOrder.tenant_id == tenant.id))
                if not res.scalars().first():
                    wo = models.WorkOrder(**w_data, tenant_id=tenant.id, reported_by_user_id=admin_user.id)
                    db.add(wo)
                    print(f"Added work order: {wo.title}")

            # 6. Add PM Schedules
            pm_data = [
                {"title": "Gen-Set Load Test", "description": "Run monthly load bank test for 2 hours.", "frequency_type": "months", "frequency_interval": 1, "asset_id": assets[1].id, "next_due": now + timedelta(days=5)},
                {"title": "HVAC Filter Replacement", "description": "Replace all HEPA filters in Sector A.", "frequency_type": "months", "frequency_interval": 3, "asset_id": assets[0].id, "next_due": now + timedelta(days=15)},
                {"title": "Forklift Safety Inspection", "description": "Check brakes, hydraulics, and tire pressure.", "frequency_type": "weeks", "frequency_interval": 2, "asset_id": assets[3].id, "next_due": now + timedelta(days=2)},
            ]

            for p_data in pm_data:
                res = await db.execute(select(models.PMSchedule).where(models.PMSchedule.title == p_data["title"], models.PMSchedule.tenant_id == tenant.id))
                if not res.scalars().first():
                    pm = models.PMSchedule(**p_data, tenant_id=tenant.id)
                    db.add(pm)
                    print(f"Added PM schedule: {pm.title}")

            await db.commit()
            print("Seeding complete!")
        except Exception as e:
            print(f"Error during seeding: {e}")
            await db.rollback()
        finally:
            await db.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
