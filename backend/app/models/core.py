import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, Text, Enum, DateTime, Integer, Numeric, JSON
from sqlalchemy import Uuid as UUID # Generic UUID
from sqlalchemy.dialects.postgresql import JSONB # We might need to replace JSONB too if using SQLite
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum
from datetime import datetime

class AssetStatus(str, enum.Enum):
    healthy = "Healthy"
    running_with_issues = "Running with issues"
    breakdown = "Breakdown"

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False) # Should be unique per tenant
    location = Column(String, nullable=True)
    category = Column(String, nullable=True)
    status = Column(String, default=AssetStatus.healthy)
    manufacturer = Column(String, nullable=True)
    model = Column(String, nullable=True)
    serial_number = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    technical_specs = Column(JSON, default={}) # Stores LOTO points and tech details
    
class WorkOrderStatus(str, enum.Enum):
    new = "new"
    in_progress = "in_progress"
    waiting_parts = "waiting_parts"
    on_hold = "on_hold"
    completed = "completed"
    cancelled = "cancelled"

class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=True)
    title = Column(String, nullable=False)
    work_order_number = Column(String, unique=True, nullable=True) # Generated code
    description = Column(Text, nullable=True)
    status = Column(String, default=WorkOrderStatus.new)
    priority = Column(String, default="low")
    
    reported_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    completed_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    completion_notes = Column(Text, nullable=True)
    signed_by_name = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    asset = relationship("Asset")
    reported_by = relationship("User", foreign_keys=[reported_by_user_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_user_id])
    completed_by = relationship("User", foreign_keys=[completed_by_user_id])

class TenantTheme(Base):
    __tablename__ = "tenant_themes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), unique=True, nullable=False)
    theme_json = Column(JSON, default={}) # Switched to generic JSON

class InventoryItem(Base):
    __tablename__ = "inventory_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    sku = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    quantity = Column(Integer, default=0)
    unit = Column(String, default="pcs") # e.g. pcs, meters, liters
    min_quantity = Column(Integer, default=0) # Low stock alert threshold
    location = Column(String, nullable=True)
    category = Column(String, nullable=True)
    
    # Cost tracking could be added later
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PMSchedule(Base):
    __tablename__ = "pm_schedules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=True)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    frequency_type = Column(String, default="days") # days, weeks, months, years
    frequency_interval = Column(Integer, default=1)
    
    last_performed = Column(DateTime, nullable=True)
    next_due = Column(DateTime, nullable=True)
    
    assigned_to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    asset = relationship("Asset")
    assigned_to = relationship("User")
    logs = relationship("PMLog", back_populates="pm_schedule", cascade="all, delete-orphan")

class PMLog(Base):
    __tablename__ = "pm_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    pm_schedule_id = Column(UUID(as_uuid=True), ForeignKey("pm_schedules.id"), nullable=False)
    
    completed_at = Column(DateTime, default=datetime.utcnow)
    completed_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    pm_schedule = relationship("PMSchedule", back_populates="logs")
    completed_by = relationship("User")

class Page(Base):
    __tablename__ = "pages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    key = Column(String, nullable=False)
    layout_json = Column(JSON, default={}) # Switched to generic JSON
    is_system_default = Column(Boolean, default=False)
