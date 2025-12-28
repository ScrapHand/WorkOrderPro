from typing import Optional
from pydantic import BaseModel, EmailStr, UUID4
from app.models.user import UserRole

class UserBase(BaseModel):
    email: str # EmailStr rejects .test domains
    full_name: Optional[str] = None
    role: UserRole = UserRole.TECHNICIAN
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class User(UserBase):
    id: UUID4
    tenant_id: UUID4
    
    class Config:
        from_attributes = True
        use_enum_values = True # Allow strings to satisfy Enum fields
