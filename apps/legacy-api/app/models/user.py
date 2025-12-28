import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy import Uuid as UUID # Generic UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    email = Column(String, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="TECHNICIAN") # ADMIN, MANAGER, TECHNICIAN
    is_active = Column(Boolean, default=True)

    # Relationships
    tenant = relationship("Tenant")
    # Add other relationships as needed (work_orders, etc)
