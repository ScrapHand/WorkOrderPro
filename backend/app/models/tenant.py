import uuid
from sqlalchemy import Column, String, Enum
from sqlalchemy import Uuid as UUID # Generic UUID compatible with SQLite (SA 2.0)
from app.db.base import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    primary_domain = Column(String, nullable=True)
    plan = Column(String, default="free") # simplified enum
    
    # Relationships
    # Use string to avoid circular import, assuming TenantTheme is available in registry
    # Note: We need to make sure models are loaded.
    # theme = relationship("TenantTheme", uselist=False, back_populates="tenant")
    # For simplicity in this scaffold without complex stamp setup, we might just query TenantTheme separately 
    # OR define relationship. Let's try relationship.
    from sqlalchemy.orm import relationship
    theme = relationship("TenantTheme", uselist=False, backref="tenant", lazy="selectin")
