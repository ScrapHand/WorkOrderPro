import { prisma } from '../database/prisma';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { logger } from '../logging/logger';

// [ARCH] Multi-Tenancy Context
export interface TenantContext {
    slug: string;
    id: string; // Now required and verified
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

// [PHASE 7] Global routes that don't strictly require a tenant context
const GLOBAL_KEYWORDS = [
    '/auth/me',
    '/super-admin',
    '/auth/logout',
    '/api/v1/tenant',
    '/api/tenant'
];

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Extract Slug - PRIORITIZE Query Params for linked assets/proxies
    let slugParam = req.query.tenant || req.query.slug;
    let slug = 'default';

    if (Array.isArray(slugParam)) {
        slug = (slugParam[0] as string) || 'default';
    } else if (typeof slugParam === 'string') {
        slug = slugParam;
    } else {
        slug = req.get('x-tenant-slug') || 'default';
    }

    slug = slug.toLowerCase().trim();

    // [DEBUG] Log resolution source for Proxies
    if (req.path.includes('/proxy')) {
        logger.debug({ slug, queryTenant: req.query.tenant, header: req.get('x-tenant-slug') }, 'Tenant middleware proxy resolution');
    }

    try {
        // [SECURITY] [PHASE 26] Session Lock Strategy
        const sessionUser = (req.session as any)?.user;
        let tenantId: string | null = null;
        let finalSlug = slug;

        if (sessionUser && !req.path.includes('/auth/') && sessionUser.role !== 'SYSTEM_ADMIN' && sessionUser.role !== 'GLOBAL_ADMIN' && sessionUser.role !== 'SUPER_ADMIN') {
            // [HARD LOCK] Enforce user's assigned tenant
            if (slug !== sessionUser.tenantSlug) {
                logger.warn({ userId: sessionUser.id, userTenant: sessionUser.tenantSlug, requestedTenant: slug }, 'Cross-tenant access attempt blocked');
                return res.status(403).json({
                    error: 'Cross-tenant access forbidden',
                    message: `You belong to '${sessionUser.tenantSlug}' and cannot access '${slug}'.`
                });
            }

            tenantId = sessionUser.tenantId;
            finalSlug = sessionUser.tenantSlug;
        } else {
            // [RESOLUTION] Resolve from slug (Login, Global Admins, or Guests)

            // [HARDENING] Special resolution for S3 Proxy to bypass cross-origin cookie loss
            if (req.path.includes('/proxy') && req.query.key) {
                const key = req.query.key as string;
                const parts = key.split('/');
                if (parts[0] === 'tenants' && parts[1]) {
                    const resolvedTenant = await prisma.tenant.findUnique({ where: { id: parts[1] } });
                    if (resolvedTenant) {
                        tenantId = resolvedTenant.id;
                        finalSlug = resolvedTenant.slug;
                        logger.debug({ tenantId, finalSlug, key }, 'Tenant resolved from proxy key');
                    }
                }
            }

            if (!tenantId) {
                const tenant = await prisma.tenant.findUnique({ where: { slug: finalSlug } });
                if (!tenant) {
                    // [RESILIENCY] If Super Admin or Auth route, and slug resolution fails, fallback to 'default'
                    if (finalSlug !== 'default') {
                        const fallbackTenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
                        if (fallbackTenant && (sessionUser?.role === 'SUPER_ADMIN' || req.path.includes('/auth/'))) {
                            logger.info({ invalidSlug: finalSlug, fallback: 'default' }, 'Tenant not found, falling back for privileged or auth route');
                            tenantId = fallbackTenant.id;
                            finalSlug = 'default';
                        }
                    }

                    if (!tenantId) {
                        const isGlobalRoute = GLOBAL_KEYWORDS.some(k => req.path.includes(k));

                        if (isGlobalRoute || sessionUser?.role === 'SUPER_ADMIN') {
                            logger.info({ path: req.path, role: sessionUser?.role, isGlobal: isGlobalRoute }, 'Using system context for global/admin route');
                            tenantId = '00000000-0000-0000-0000-000000000000'; // SYSTEM UUID
                            finalSlug = 'system';
                        } else {
                            // [DIAGNOSTICS] Log failed resolution details for production debugging
                            logger.warn({
                                path: req.path,
                                slug: finalSlug,
                                isGlobal: isGlobalRoute,
                                hasSession: !!sessionUser,
                                role: sessionUser?.role
                            }, 'Tenant not found during resolution');
                            return res.status(404).json({
                                error: 'Tenant not found',
                                slug: finalSlug,
                                _debug: process.env.NODE_ENV !== 'production' ? { path: req.path, isGlobal: isGlobalRoute } : undefined
                            });
                        }
                    }
                } else {
                    tenantId = tenant.id;
                }
            }
        }

        if (!tenantId) {
            logger.error({ slug: finalSlug }, 'Tenant ID could not be identified');
            return res.status(401).json({ error: 'Unauthorized: Tenant could not be identified' });
        }

        const context: TenantContext = {
            slug: finalSlug,
            id: tenantId
        };

        // 4. Set Tenant ID in Postgres session for RLS
        // We use $executeRawUnsafe because it's a SET LOCAL command
        try {
            await prisma.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
        } catch (dbError) {
            logger.error({ error: dbError, tenantId }, 'Failed to set app.tenant_id for RLS');
            // Non-fatal if DB doesn't support it or RLS not enabled yet, 
            // but in production this should be strictly enforced.
        }

        // 5. Run next() within the AsyncLocalStorage context
        tenantStorage.run(context, () => {
            next();
        });
    } catch (error) {
        logger.error({ error }, 'Internal tenant resolution error');
        res.status(500).json({ error: 'Internal tenant resolution error' });
    }
};

// Helper: Get current tenant safely
export const getCurrentTenant = (): TenantContext | undefined => {
    return tenantStorage.getStore();
};
