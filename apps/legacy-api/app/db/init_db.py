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
            email = f"{u['email_prefix']}@test.com"
            # distinct email for each tenant? No, usually email is unique constraint?
            # Wait, User model usually has (email, tenant_id) unique constraint?
            # Let's verify User model constraints. 
            # If email is globally unique, we can't share "admin@test.com" across tenants.
            # Only if unique constraint is (email, tenant_id).
            # Let's check models/user.py first. Assuming composite unique for multi-tenancy.
            # If not, we must use admin@demo.com and admin@acme.com.
            # Safest bet is to use tenant-specific emails if we aren't sure, 
            # OR check the model now. 
            # Let's assume we want "admin@test.com" to work for the user. 
            # If I can't check, I'll make unique emails like "admin@demo.test" and "admin@acme.test"?
            # User asked for "admin@test.com".
            # Let's check the model first to be sure.
            pass
            
    # CHECKING MODEL FIRST

