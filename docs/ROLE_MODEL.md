# Role-Based Access Control (RBAC) Model

## Overview
WorkOrderPro utilizes a Hierarchical RBAC model combined with Multi-Tenant Isolation. Every user is strictly bound to a single `tenantId` (except SUPERADMIN). Permissions are additive based on the role hierarchy.

## Role Definitions

### 1. SUPERADMIN (System Level)
- **Scope**: Global (All Tenants)
- **Description**: Platform owners and developers.
- **Capabilities**:
  - Create/Delete Tenants.
  - Manage Feature Flags & Global Entitlements.
  - View System Audit Logs.
  - Access to tenant data for debugging (Audit logged).

### 2. GLOBAL_ADMIN (System Level)
- **Scope**: Global (Limited)
- **Description**: Operational support staff.
- **Capabilities**:
  - View Tenant Lists.
  - Reset User Passwords (system-wide).
  - Cannot view sensitive tenant Work Order details without explicit escalation.

### 3. TENANT_ADMIN (Tenant Level)
- **Scope**: Single Tenant
- **Description**: The primary administrator for a client organization.
- **Capabilities**:
  - Manage Users (Invite/Remove) within their tenant.
  - Configure Tenant Settings (Logo, Address).
  - View Tenant Audit Logs.
  - Full access to all Work Orders and Inventory in their tenant.

### 4. USER (Tenant Level)
- **Scope**: Single Tenant
- **Description**: Standard field technicians and operators.
- **Capabilities**:
  - Create/Edit Work Orders.
  - Upload Files.
  - View Inventory.
  - Cannot delete Work Orders.
  - Cannot manage other users.

## Data Isolation Policy
- **Rule 1**: Every database query involving tenant data MUST include `WHERE tenantId = session.user.tenantId`.
- **Rule 2**: SUPERADMIN access to tenant data must be explicitly logged in the `AuditLog` table.
- **Rule 3**: The `tenantId` is never accepted from the client request body for security-critical operations; it is always derived from the authenticated session.
