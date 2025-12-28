from typing import Generator, Optional
import uuid
from fastapi import Depends, HTTPException, status, Header, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import ValidationError
from app import models, schemas
from app.core import security
from app.core.config import settings
from app.db.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_current_tenant_slug(
    x_tenant_slug: Optional[str] = Header(None),
    request: Request = None
) -> Optional[str]:
    # Also support extracting from path if header is missing, relying on middleware or direct logic
    # For now, header is primary
    return x_tenant_slug

from sqlalchemy.orm import selectinload

async def get_current_tenant(
    slug: Optional[str] = Depends(get_current_tenant_slug),
    db: AsyncSession = Depends(get_db)
) -> Optional[models.Tenant]:
    print(f"DEBUG: Resolving Tenant. Slug={slug}")
    if not slug:
        print("DEBUG: No slug provided.")
        return None
    
    # Query tenant with theme loaded
    result = await db.execute(
        select(models.Tenant)
        .options(selectinload(models.Tenant.theme))
        .where(models.Tenant.slug == slug)
    )
    tenant = result.scalars().first()
    if not tenant:
        print(f"DEBUG: Tenant '{slug}' not found in DB.")
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    print(f"DEBUG: Found Tenant: {tenant.name} ({tenant.id})")
    return tenant

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> models.User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY if hasattr(settings, 'SECRET_KEY') else "SECRET", algorithms=[security.ALGORITHM]
        )
        token_data = schemas.TokenPayload(**payload)
        
        # Explicit UUID cast and wrap DB op
        user_uuid = uuid.UUID(token_data.sub)
        result = await db.execute(select(models.User).where(models.User.id == user_uuid))
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
        
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Auth Dependency Failed: {str(e)}")

async def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
    current_tenant: Optional[models.Tenant] = Depends(get_current_tenant),
) -> models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Verify user belongs to the requested tenant if tenant context is set
    # Note: user.tenant_id is a UUID, current_tenant.id is a UUID
    if current_tenant and current_user.tenant_id != current_tenant.id:
        # Unless it's a super-admin (not scoped to implement yet)
         raise HTTPException(status_code=403, detail="User does not belong to this tenant")
         
    return current_user

    return current_user

class RoleChecker:
    def __init__(self, allowed_roles: list[models.UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: models.User = Depends(get_current_active_user)):
        # Debug Role
        import sys
        print(f"DEBUG ROLE CHECK: {user.email} Role: {user.role} (Type: {type(user.role)})", file=sys.stderr)
        sys.stderr.flush()
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Operation not permitted"
            )
        return user

# PRE-MADE CHECKERS
require_admin = RoleChecker([models.UserRole.ADMIN])
require_manager = RoleChecker([models.UserRole.ADMIN, models.UserRole.MANAGER])
# Legacy catch-all for Technician+ if needed, but not strictly asked for yet.
