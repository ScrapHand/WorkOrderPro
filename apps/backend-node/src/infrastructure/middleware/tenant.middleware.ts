import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

const prisma = new PrismaClient();

// [ARCH] Multi-Tenancy Context
export interface TenantContext {
    slug: string;
    id: string; // Now required and verified
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Extract Slug from Header (X-Tenant-Slug)
    let slug = req.get('x-tenant-slug') || (req.query.tenant as string) || (req.query.slug as string) || 'default';
    slug = slug.toLowerCase().trim();

    try {
        // [SECURITY] [PHASE 26] Session Lock Strategy
        const sessionUser = (req.session as any)?.user;
        let tenantId: string | null = null;
        let finalSlug = slug;

        if (sessionUser && sessionUser.role !== 'SYSTEM_ADMIN' && sessionUser.role !== 'GLOBAL_ADMIN' && sessionUser.role !== 'SUPER_ADMIN') {
            // [HARD LOCK] If a user is logged in, FORGET the header? No, we must CHECK it.
            // If they ask for 'default' but belong to 'aston', we should BLOCK them (403),
            // NOT silently give them 'aston' data (which looks like a bypass).

            if (slug !== sessionUser.tenantSlug) {
                return res.status(403).json({
                    error: 'Cross-tenant access forbidden',
                    message: `You belong to '${sessionUser.tenantSlug}' and cannot access '${slug}'.`
                });
            }

            tenantId = sessionUser.tenantId;
            finalSlug = sessionUser.tenantSlug;
        } else {
            // [RESOLUTION] For Login or Global Admins, resolve from slug
            const tenant = await prisma.tenant.findUnique({ where: { slug: finalSlug } });
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
            tenantId = tenant.id;
        }

        if (!tenantId) return res.status(401).json({ error: 'Unauthorized: Tenant could not be identified' });

        const context: TenantContext = {
            slug: finalSlug,
            id: tenantId
        };

        // 4. Run next() within the AsyncLocalStorage context
        tenantStorage.run(context, () => {
            next();
        });
    } catch (error) {
        console.error('[TenantMiddleware] Error:', error);
        res.status(500).json({ error: 'Internal tenant resolution error' });
    }
};

// Helper: Get current tenant safely
export const getCurrentTenant = (): TenantContext | undefined => {
    return tenantStorage.getStore();
};
