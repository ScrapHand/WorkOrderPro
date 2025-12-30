from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app import models, schemas
from app.api import deps
from app.core import security
from app.core.config import settings

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
async def login_access_token(
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
    current_tenant: models.Tenant = Depends(deps.get_current_tenant) # Added dependency
) -> Any:
    """
    OAuth2 compatible token login. 
    REQUIRES X-Tenant-Slug header to identify which tenant the user belongs to.
    """
    if not current_tenant:
        # Fallback: Allow login without tenant header ONLY if email is globally unique?
        # No, strict multi-tenancy rules: Always require tenant context.
        # But wait, 'demo' and 'acme' might share 'admin@demo.com'? No, normally separate.
        # But for 'admin@demo.com' created in startup, it's linked to 'demo' tenant.
        # If I try to login to 'acme' with 'admin@demo.com', it should fail if user is not in 'acme'.
        raise HTTPException(status_code=400, detail="Tenant header required for login")

    # Query user by email AND tenant
    stmt = select(models.User).where(
        models.User.email == form_data.username,
        models.User.tenant_id == current_tenant.id
    )
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
            
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=60) # extended for dev
    access_token = security.create_access_token(
        subject=user.id, role=user.role, expires_delta=access_token_expires
    )
    
    # Set HTTP-Only Cookie for Next.js App
    # Set HTTP-Only Cookie for Next.js App
    # Must be SameSite=None + Secure=True for Vercel -> Render cross-site requests
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=60 * 60,
        expires=60 * 60,
        samesite="none",
        secure=True,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
