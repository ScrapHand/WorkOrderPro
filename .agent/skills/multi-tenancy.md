# Skill: Multi-Tenancy Implementation

## Context
WorkOrderPro is a strictly multi-tenant application. Data isolation is enforced at the database level and routed via the tenant slug in the URL.

## Backend Rules
1. **Tenant ID Extraction**: Always use the `tenantMiddleware` which injects `tenantId` into the request context.
2. **Query Filtering**: Every Prisma query MUST include `tenantId`.
   ```typescript
   const workOrders = await prisma.workOrder.findMany({
     where: { tenantId: tenantCtx.id }
   });
   ```
3. **AsyncLocalStorage**: Use `getCurrentTenant()` from `tenant.middleware.ts` to retrieve the current context in services/controllers.
4. **RLS (Security)**: The database uses Row Level Security. Ensure `SET LOCAL app.tenant_id = '${tenantId}'` is executed for raw queries.

## Frontend Rules
1. **Dynamic Routing**: All dashboard routes must be under `[tenantSlug]`.
2. **Link Construction**: NEVER hardcode slugs. Use `/${tenantSlug}/dashboard/...`.
3. **API Headers**: The `api.ts` interceptor automatically adds `X-Tenant-Slug`. Ensure the `getTenantSlug` helper is functioning correctly.
4. **Navigation**: Use the `useParams()` hook in Next.js components to get the current tenant slug.

## Common Pitfalls
- **Missing Filter**: Forgetting `tenantId` in a `delete` or `update` operation is a CRITICAL security violation.
- **Cross-Tenant Leaks**: Ensure that session data for one tenant cannot be used to access another (enforced in `tenant.middleware.ts`).

## 🧩 Modular Feature Provisioning
Multi-tenancy now supports per-tenant feature activation.
- **Storage**: Features are stored in the `Tenant.features` JSON field.
- **Access**: Managed by Super Admins through the Nexus dashboard.
- **Enforcement**:
  - **Frontend**: Use the `useFeatures` hook to guard UI components.
  - **Backend**: Service layers should check `tenant.features` before executing modular logic.

## 🌐 Global Context vs Tenant Context (Resilience)
A common mistake in multi-tenant systems is over-binding global tools to tenant contexts.
- **Problem**: Requiring a strict tenant header for `/auth/me` or `/super-admin` will block the platform if the registry is missing or a user is not yet bound.
- **Rule 1 (Keywords over Prefixes)**: Use keyword-based matching (`includes`) for global routes instead of `startsWith`. Production middleware often sees absolute paths that include environment-specific prefixes (e.g., `/api/v1/` vs `/`).
- **Rule 2 (System Context)**: Global routes MUST permit a `SYSTEM` context fallback in the `tenantMiddleware` to ensure the platform remains manageable.
- **Rule 3 (Diagnostics)**: Tenant resolution failures MUST log full path details and resolution state to allow immediate debugging of environment-specific routing issues.
