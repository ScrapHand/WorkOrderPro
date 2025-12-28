import logging
from app import models, schemas
from app.core.config import settings
from app.core.security import get_password_hash
from sqlalchemy.orm import Session
from sqlalchemy.future import select

logger = logging.getLogger(__name__)

async def init_db(db: Session) -> None:
    # 1. Create Default Tenant
    result = await db.execute(select(models.Tenant).where(models.Tenant.slug == "demo"))
    tenant = result.scalars().first()
    
    if not tenant:
        tenant = models.Tenant(
            name="Demo Corp",
            slug="demo", 
            features={}
        )
        db.add(tenant)
        await db.commit()
        await db.refresh(tenant)
        logger.info(f"Created default tenant: {tenant.name} ({tenant.id})")
    
    # 2. Define Default Users
    users_to_create = [
        {"email": "admin@test.com", "full_name": "System Admin", "role": "admin"},
        {"email": "manager@test.com", "full_name": "Site Manager", "role": "manager"},
        {"email": "leader@test.com", "full_name": "Team Leader", "role": "team_leader"},
        {"email": "engineer@test.com", "full_name": "Field Engineer", "role": "engineer"},
        {"email": "view@test.com", "full_name": "Guest Viewer", "role": "viewer"},
    ]

    for user_data in users_to_create:
        result = await db.execute(select(models.User).where(models.User.email == user_data["email"]))
        user = result.scalars().first()
        
        if not user:
            user = models.User(
                email=user_data["email"],
                full_name=user_data["full_name"],
                password_hash=get_password_hash("password"), # Default password for all
                role=user_data["role"],
                is_active=True,
                tenant_id=tenant.id
            )
            db.add(user)
            logger.info(f"Created user: {user.email} with role {user.role}")
        else:
            # Enforce duplicate check / could update role here if needed
            if user.role != user_data["role"]:
                user.role = user_data["role"]
                db.add(user)
                logger.info(f"Updated user role: {user.email} -> {user.role}")
            pass

    await db.commit()
