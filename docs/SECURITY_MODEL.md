# SECURITY_MODEL.md

## Threat Model
The primary concern for WorkOrderPro as a multi-tenant SaaS is **Broken Access Control**.
Potential threats include:
- **IDOR (Insecure Direct Object Reference)**: Accessing another tenant's assets or work orders by guessing UUIDs.
- **Cross-Tenant Injection**: Injecting data into another tenant's scope.
- **Session Hijacking**: Stealing session cookies.
- **Privilege Escalation**: A technician gaining admin rights within a tenant.

## Tenant Isolation Strategy (Defense in Depth)
We follow a multi-layered isolation strategy:

### 1. Database Layer: Postgres Row-Level Security (RLS)
- Every tenant-owned table has a `tenant_id` column.
- RLS policies are enabled on all such tables.
- **Policy**: `USING (tenant_id = current_setting('app.tenant_id')::uuid)`
- The application sets this local variable at the start of every transaction/request.

### 2. Application Layer: Mandatory Query Guards
- `Prisma` middleware/extensions will be used to automatically inject `tenant_id` into all queries.
- Controllers must still validate ownership for specific resource operations (e.g., S3 presigning).

### 3. Middleware: Tenant Context
- `AsyncLocalStorage` is used to store the current `tenantId` and `slug`.
- Verified against the user's session in every request.

## Authentication & Authorization
- **Hashing**: Argon2id for all passwords.
- **Sessions**: httpOnly, Secure, SameSite=None/Lax cookies with session rotation.
- **RBAC**: 
    - **Global Roles**: `SUPER_ADMIN` (Platform-level).
    - **Tenant Roles**: `OWNER`, `ADMIN`, `MANAGER`, `TECHNICIAN`, `VIEWER`.
- **Authorization**: Route-level middleware + repository-level filtering.

## S3 Security Strategy
- **Path Isolation**: Files stored at `tenants/{tenantId}/{entityType}/{entityId}/{uuid}-{filename}`.
- **Presigning**: URLs generated server-side after verifying tenant membership and resource ownership.
- **Bucket Controls**: Public access blocked. Mandatory presigning for all reads/writes.

## Audit Logging
We log the following security-critical events:
- Authentication: Login (success/fail), Logout, Password Reset.
- Authorization: Role changes, Permission updates.
- Data Access: S3 presign requests, Tenant creation/deletion.
- Admin actions: Impersonation starts/ends.

## Operational Controls
- **Rate Limiting**: Applied to `/auth`, `/upload/presign`, and other sensitive endpoints.
- **Secrets Management**: No secrets in source control; managed via environment variables.
- **Backups**: Automated DB backups with point-in-time recovery (handled by Render).
