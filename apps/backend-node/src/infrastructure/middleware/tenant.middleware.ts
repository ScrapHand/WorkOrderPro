import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

// [ARCH] Multi-Tenancy Context
// We use AsyncLocalStorage to store the current tenant for the duration of the request.
// This allows deep service layers to access the tenant without passing it as a parameter everywhere.

export interface TenantContext {
    slug: string;
    id?: string; // To be populated by DB lookup in later phases
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // 1. Extract Slug from Header (X-Tenant-Slug)
    // We also support query param for easier dev testing or for Proxy URLs (static assets)
    let slug = req.get('x-tenant-slug') || (req.query.tenant as string) || (req.query.slug as string);

    // 2. Default to 'default' tenant if not provided (for Phase 1 dev)
    // In production, this might be strict (return 400).
    if (!slug) {
        slug = 'default';
        // console.warn('Warning: No X-Tenant-Slug provided, defaulting to "default"');
    }

    // 3. Normalize
    const context: TenantContext = {
        slug: slug.toLowerCase().trim()
    };

    // [SECURITY] [PHASE 25] Strict Tenant Validation
    // If a user is logged in, their session tenant must match the requested slug
    // unless they are a GLOBAL_ADMIN.
    const sessionUser = (req.session as any)?.user;
    if (sessionUser && sessionUser.role !== 'SYSTEM_ADMIN' && sessionUser.role !== 'GLOBAL_ADMIN') {
        const sessionTenantSlug = sessionUser.tenantSlug;
        if (sessionTenantSlug && sessionTenantSlug !== context.slug) {
            return res.status(403).json({
                error: 'Cross-tenant access forbidden',
                message: `Your account belongs to ${sessionTenantSlug}, but you tried to access ${context.slug}.`
            });
        }
    }

    // 4. Run next() within the AsyncLocalStorage context
    tenantStorage.run(context, () => {
        next();
    });
};

// Helper: Get current tenant safely
export const getCurrentTenant = (): TenantContext | undefined => {
    return tenantStorage.getStore();
};
