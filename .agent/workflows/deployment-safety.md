---
description: Strict protocol for safe backend deployments
---

# Safe Deployment Protocol 🛡️

To prevent deployment failures (build errors, missing files, runtime crashes), you MUST follow this checklist before every `git push`.

## 1. The "TypeScript Truth" Check
**Never assume code works just because you edited it.**
Run this command in the `apps/backend-node` directory:
```bash
npx tsc --noEmit
```
-   **If it fails:** YOU CANNOT DEPLOY. Fix the errors.
-   **Common Errors:**
    -   `Cannot find module`: You messed up a relative import (e.g., `../../` vs `../../../`).
    -   `Property 'x' does not exist`: Your types don't match the Prisma schema.

## 2. The "Ghost File" Check
If you deleted a file (e.g., `inventory.service.ts`), you **MUST** ensure it is removed from Git.
```bash
# BAD:
rm src/services/old.ts

# GOOD:
git rm src/services/old.ts
```
**Verify:** Check `server.ts` imports. If you deleted a service, did you remove the `import` statement in `server.ts`? The build will fail if you didn't.

## 3. The "Tenant Context" Audit
If you are writing a Controller:
-   **Rule:** `getCurrentTenant()` takes ZERO arguments.
-   **Rule:** It returns `{ slug: string }`. It does NOT return the full Tenant object.
-   **Requirement:** You MUST look up the tenant in the DB using the slug to get the `id`.

```typescript
// ✅ CORRECT
const ctx = getCurrentTenant();
const tenant = await prisma.tenant.findUnique({ where: { slug: ctx.slug } });
const data = await service.doSomething(tenant.id);

// ❌ WRONG
const tenant = getCurrentTenant(req); // Error: Expected 0 args
const data = await service.doSomething(tenant.id); // Error: tenant.id undefined
```

## 4. The "Atomic Push"
Before pushing, ensure ALL changes are staged.
```bash
git status
# Are there Modified files not staged?
git add .
git commit -m "fix: described changes"
```
**Never push if you have uncommitted local fixes.**
