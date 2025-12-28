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
    # We will create these users for EACH tenant so login works on both URLs
    users_to_create = [
        {"email_prefix": "admin", "full_name": "System Admin", "role": "admin"},
        {"email_prefix": "manager", "full_name": "Site Manager", "role": "manager"},
        {"email_prefix": "leader", "full_name": "Team Leader", "role": "team_leader"},
        {"email_prefix": "engineer", "full_name": "Field Engineer", "role": "engineer"},
        {"email_prefix": "view", "full_name": "Guest Viewer", "role": "viewer"},
    ]

    for tenant in tenants:
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
    
    await db.commit()
