# Skill: Platform Orchestration (Super Admin) 🛡️

This skill covers the global management of the WorkOrderPro ecosystem, including cross-tenant oversight and modular feature provisioning.

## 🏛️ The Super Admin Nexus
The Super Admin dashboard (/super-admin) provides a unique platform-wide view.
- **Data Oversight**: Access to global metrics (total tenants, users, work orders) and growth analytics.
- **Global User Directory**: Ability to search and manage users across all tenants.
- **Platform Audit Logs**: Tracking of all administrative actions via the `PlatformLog` model.

## ⚙️ Modular Feature Provisioning
The platform uses a granular entitlement system. Instead of rigid plans, features are toggled per tenant via the `features` JSON field in the `Tenant` model.

### 🚩 Key Feature Flags:
- `factoryLayout`: Factory Visualizer / Drag & Drop
- `inventoryIntelligence`: Automated Stock Alerts
- `shiftAnalytics`: Shift Performance & Handover Analytics
- `autoDispatch`: AI-Driven Job Assignment
- `assetTelemetry`: Real-time machine health monitoring
- `workOrderSLA`: Automatic resolution target tracking

### 🛡️ Feature Guarding Protocol
Always wrap feature-specific UI in the `useFeatures` hook:
```tsx
const { isEnabled } = useFeatures();
if (isEnabled('shiftAnalytics')) {
  return <ShiftAnalyticsWidget />;
}
```

## 🏗️ Architectural Constraints
- **SUPER_ADMIN Role**: Only users with this role can access `/api/super-admin` routes.
- **Tenant Bypass**: Super Admin routes typically bypass standard `tenantMiddleware` or act upon a specific `tenantSlug` provided in the request.
- **Audit Trails**: Every platform-level change (like a feature toggle) **MUST** be logged in the `PlatformLog` table for accountability.

## ⚡ Platform Resilience (Crucial Learning)
A major pitfall in multi-tenant architecture is over-constraining platform-level tools to tenant contexts.
- **Lesson**: The Super Admin Nexus must stay operational even if the `default` tenant is missing or the database is in a raw state.
- **Robust Path Resolution**: Avoid `startsWith` checks for global routes as environment prefixes (e.g. `/api/v1/`) can vary. Use keyword inclusion (`req.path.includes('/super-admin')`) to ensure the `SYSTEM` context fallback is triggered reliably.
- **Diagnostic Logging**: Always log the incoming `req.path` and resolution outcome (`isGlobal`) when a tenant lookup fails. This prevents "silent" routing mismatches from blocking production access.

## 🔐 Bootstrap & Global Lock
- **Bootstrap Protocol**: The only way to create the initial Super Admin account on a fresh production environment should be via a secure, script-based bootstrap process (e.g., `scripts/bootstrap-superadmin.ts`) that runs post-deployment.
- **Global Lock**: The landing page (`/`) and all dashboard routes MUST be behind a global authentication lock (e.g., Next.js Middleware). No "guest" or "demo" access should be permitted on a production enterprise instance.
- **Identity Blacklist**: Hard-code critical blocks for known test identities (e.g., `admin@example.com`) in the Auth Controller to prevent "ghost" account resurgence during migrations.
