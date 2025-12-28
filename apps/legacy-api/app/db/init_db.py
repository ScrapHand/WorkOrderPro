import logging
from app import models, schemas
from app.core.config import settings
from app.core.security import get_password_hash
from sqlalchemy.orm import Session
from sqlalchemy.future import select

logger = logging.getLogger(__name__)

async def init_db(db: Session) -> None:
    tenants = []
    
    # 1. Create Tenants
    for slug, name in [("demo", "Demo Corp"), ("acme", "ACME Industries")]:
        result = await db.execute(select(models.Tenant).where(models.Tenant.slug == slug))
        tenant = result.scalars().first()
        if not tenant:
            tenant = models.Tenant(name=name, slug=slug, features={})
            db.add(tenant)
            await db.commit()
            await db.refresh(tenant)
            logger.info(f"Created tenant: {tenant.name} ({tenant.id})")
        tenants.append(tenant)
    
    # 2. Define Default Users
    from app.models.user import UserRole
    # We will create these users for EACH tenant so login works on both URLs
    users_to_create = [
        {"email_prefix": "admin", "full_name": "System Admin", "role": UserRole.ADMIN},
        {"email_prefix": "manager", "full_name": "Site Manager", "role": UserRole.MANAGER},
        {"email_prefix": "leader", "full_name": "Team Leader", "role": UserRole.TECHNICIAN}, # Simplify for now
        {"email_prefix": "engineer", "full_name": "Field Engineer", "role": UserRole.TECHNICIAN},
        {"email_prefix": "view", "full_name": "Guest Viewer", "role": UserRole.VIEWER},
    ]

    for tenant in tenants:
        # User seeding (existing logic)...
        created_users = {}
        for u in users_to_create:
            # Use tenant-specific email to avoid unique constraint violations
            email = f"{u['email_prefix']}@{tenant.slug}.test"
            
            result = await db.execute(select(models.User).where(
                models.User.email == email,
                models.User.tenant_id == tenant.id
            ))
            user = result.scalars().first()
            
            if not user:
                user = models.User(
                    email=email,
                    full_name=u["full_name"],
                    password_hash=get_password_hash("password"), 
                    role=u["role"],
                    is_active=True,
                    tenant_id=tenant.id
                )
                db.add(user)
                logger.info(f"Created user: {user.email} (Role: {user.role}) in Tenant: {tenant.name}")
            else:
                if user.role != u["role"]:
                    user.role = u["role"]
                    db.add(user)
                    logger.info(f"Updated user role: {user.email} -> {user.role} in Tenant: {tenant.name}")
            created_users[u["email_prefix"]] = user
            
        # 3. Seed Assets (Only for Demo/Acme if empty)
        # Check if assets exist
        a_res = await db.execute(select(models.Asset).where(models.Asset.tenant_id == tenant.id))
        if not a_res.scalars().first():
            from datetime import datetime, timedelta
            import uuid
            
            # Create Assets
            assets = [
                models.Asset(name="Hydraulic Press A1", description="Main line press", code="HP-01", status="run", model="X1000", manufacturer="Acme Corp", location="Zone A", tenant_id=tenant.id),
                models.Asset(name="Conveyor Belt C2", description="Packaging conveyor", code="CB-02", status="breakdown", model="BeltPro", manufacturer="LogistiCo", location="Zone B", tenant_id=tenant.id),
                models.Asset(name="Cooling Tower T1", description="External cooling", code="CT-01", status="run", model="ChillMaster", manufacturer="HVAC Inc", location="Roof", tenant_id=tenant.id),
            ]
            for a in assets:
                db.add(a)
            await db.flush() # get IDs
            
            logger.info(f"Seeded {len(assets)} assets for {tenant.name}")

            # Create Work Orders
            # Assign to admin or manager
            assignee = created_users.get("manager") or created_users.get("admin")
            
            work_orders = [
                models.WorkOrder(
                    tenant_id=tenant.id,
                    title="Emergency Belt Repair",
                    description="Conveyor belt snapped during shift.",
                    status="open",
                    priority="high",
                    asset_id=assets[1].id, # Conveyor
                    created_by_user_id=assignee.id, 
                    assigned_to_user_id=assignee.id,
                    created_at=datetime.utcnow() - timedelta(hours=2),
                    work_order_number="WO-1001"
                ),
                models.WorkOrder(
                    tenant_id=tenant.id,
                    title="Routine Press Maintenance",
                    description="Monthly hydraulic check.",
                    status="open",
                    priority="medium",
                    asset_id=assets[0].id, # Press
                    created_by_user_id=assignee.id, 
                    assigned_to_user_id=assignee.id,
                    created_at=datetime.utcnow() - timedelta(days=1),
                    work_order_number="WO-1002"
                )
            ]
            for wo in work_orders:
                db.add(wo)
            
            logger.info(f"Seeded {len(work_orders)} work orders for {tenant.name}")

    await db.commit()
