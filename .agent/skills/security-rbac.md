# Skill: Security & RBAC (Role-Based Access Control)

## Context
Security is managed via session-based authentication and role/permission-based authorization enforced by middleware.

## Middleware Layer
1. **requireAuth**: Ensures the request has a valid session.
2. **requireTenantContext**: Ensures the request is scoped to a valid tenant.
3. **requireRole(role)**: Ensures the user has the specified role or higher (Super Admin > Admin > Technician > Guest).
4. **requirePermission(permission)**: Ensures the user has the explicit permission string required for the action.

## RBAC Implementation
- **Roles**: Defined in the `UserRole` enum.
- **Permissions**: Granular strings (e.g., `work_order:read`, `asset:write`).
- **Hierarchy**: Roles follow a weight-based hierarchy. A `SUPER_ADMIN` typically bypasses most permission checks.

## 🛡️ Platform Security (Nexus Tier)
The Super Admin tier introduces platform-level security concepts.
- **Global Context**: Super Admin routes (/api/super-admin) and system endpoints (/auth/me) bypass standard tenant context for platform-level operations.
- **SYSTEM Context Fallback**: If a global keyword is matched and no tenant is resolved, the middleware MUST fallback to the `SYSTEM` context (reserved UUID) to ensure admin tool availability.
- **Auditing**: All platform configuration changes (features, tenant settings) MUST be logged in the `PlatformLog` model.
- **Entitlements**: Features are guarded both by Role (who you are) and Entitlement (what the tenant has paid for).

## Backend Security Checklist
- [ ] Endpoint is wrapped in `requireAuth`.
- [ ] Endpoint is wrapped in `requireTenantContext`.
- [ ] Action-specific permission is checked via `requirePermission`.
- [ ] Resource ownership is verified (user belongs to the tenant).

## Frontend Security
1. **RoleGuard**: Use the `<RoleGuard>` component to conditionally render UI elements based on permissions.
2. **Auth Hooks**: Use `useUser()` or `useAuth()` to access roles and permissions in client-side logic.

## Common Pitfalls
- **Implicit Trust**: Never trust `userId` or `tenantId` from the request body. Always resolve from the session/context.
- **Permission Overlap**: Ensure permissions are orthogonal and don't grant unintended access.
