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
- **SYSTEM Context**: Fallback for platform-level management paths. Use `00000000-0000-0000-0000-000000000000`.
- **Auditing**: All platform configuration changes (features, tenant settings) MUST be logged in the `PlatformLog` model.
- **Entitlements**: Features are guarded both by Role (who you are) and Entitlement (what the tenant has paid for).

## Enterprise Hardening (UK/GDPR Standards)
- **Single Session Enforcement**: Map `lastSessionId` in the `User` model. On login, delete the previous session from the store to prevent multi-device data exposure.
- **URL Guess-Proofing**: Middleware must return generic 403/404 errors for cross-tenant attempts. Never leak slug existence or account associations in error messages.
- **Session Rotation**: Regenerate sessions on login to prevent fixation attacks.

## 🛡️ Edge-Tier Protection (Next.js)
- **Middleware is Mandatory**: Every frontend project MUST have a `middleware.ts` at the root/src level to protect internal routes (`/super-admin`, `/[tenantSlug]/dashboard`) at the edge.
- **Fail-Safe Redirects**: Unauthenticated requests to protected paths MUST be redirected to `/auth/login` before reaching the page components.

## 🗑️ Total Wipe Protocol (Clean Slate)
- **Aggressive Decommissioning**: When implementing a "Clean Slate", always use `TRUNCATE TABLE ... CASCADE` in the seed script. This ensures remote production databases are fully purged of legacy/ghost accounts (e.g., `admin@example.com`) that may have persisted from previous builds.
- **Nuclear Endpoint**: Always maintain a protected `nuclear-wipe` endpoint in the `DebugController` for emergency manual database purges if build-process scripts fail.

## 🚫 Identity Blacklisting
- **Ghost Account Protection**: If a specific test account (e.g., `admin@example.com`) persistently appears or is hard to purge, implement a synchronous identity blacklist in the `AuthController` to block it at the logic layer.
- **Fail-Safe Logic**: Logic-tier blocks are more reliable than database-tier deletes during complex migration phases.

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
