from typing import Optional, Dict, Any
from pydantic import BaseModel, UUID4

class TenantBase(BaseModel):
    name: str
    slug: str
    primary_domain: Optional[str] = None

class TenantCreate(TenantBase):
    pass

class TenantUpdate(TenantBase):
    pass

class Tenant(TenantBase):
    id: UUID4
    theme_json: Optional[Dict[str, Any]] = {}
    
    class Config:
        from_attributes = True # Pydantic V2

class TenantThemeUpdate(BaseModel):
    colors: Optional[Dict[str, Any]] = None
    branding: Optional[Dict[str, Any]] = None
    naming: Optional[Dict[str, Any]] = None
