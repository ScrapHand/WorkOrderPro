from typing import Optional
from pydantic import BaseModel, EmailStr, UUID4

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "viewer"
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class User(UserBase):
    id: UUID4
    tenant_id: UUID4
    
    class Config:
        from_attributes = True
