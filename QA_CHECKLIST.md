# QA Checklist: System Remediation & Factory Layout Pivot

## Phase 1: Emergency Access & Auth
- [ ] **Run Admin Restoration Script**:
  - Command: `cd apps/backend-node && npx ts-node scripts/create-admin.ts`
  - Expected: Script creates "Global System Tenant" and "admin@workorderpro.com".
- [ ] **Super Admin Login**:
  - URL: `/login`
  - Credentials: `admin@workorderpro.com` / `password123`
  - Expected: Login succeeds, no "Guest" role, sidebar shows Super Admin options.
- [ ] **Cookie Persistence**:
  - Action: Inspect cookies in DevTools.
  - Expected: `wop_sid` is present, `Partitioned` attribute is set, `SameSite=None` (in prod) or `Lax` (in dev).

## Phase 2: Deployment Verification
- [ ] **Vercel Build Simulation**:
  - Run `npm run build --filter=web` from monorepo root.
  - Expected: Success.
- [ ] **Prisma Migration**:
  - Run `npx prisma migrate dev --name factory_layout_pivot` inside `apps/backend-node`.
  - Expected: Models `FactoryLayout`, `FactoryNode`, `FactoryEdge` are created.

## Phase 3: Factory Layout Designer
- [ ] **Graph Hook Functional Test**:
  - Check `apps/web/src/hooks/useGraphMutation.ts` for TanStack Query integration.
  - Action: Trigger `mutate` with dummy data.
  - Expected: Instant UI update (optimistic) and rollback on mock error.

## Phase 4: Branding & Persistence
- [ ] **Tenant Branding**:
  - Action: Update branding in Admin panel.
  - Expected: Colors persist after refresh (using `brandingConfig` in DB).
- [ ] **S3 Uploads**:
  - Action: Upload an asset image.
  - Expected: Presigned URL generated, image displays correctly (handled by `UploadController.proxy`).
