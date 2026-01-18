import { prisma } from '../database/prisma';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { logger } from '../logging/logger';

// [ARCH] Multi-Tenancy Context
export interface TenantContext {
    slug: string;
    id: string; // Now required and verified
}

// [TYPE SAFETY] Extend Express Request
declare global {
    namespace Express {
        interface Request {
            tenantId?: string;
            tenantSlug?: string;
        }
    }
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

// [PHASE 7] Global routes that don't strictly require a tenant context
const GLOBAL_KEYWORDS = [
    '/auth/me',
    '/super-admin',
    '/auth/logout',
    '/api/v1/tenant',
    '/api/tenant',
    '/health',
    '/debug'
];

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Extract Slug - PRIORITIZE Query Params for linked assets/proxies
    let slugParam = req.query.tenant || req.query.slug || req.get('x-tenant-override');
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
        // [SECURITY] [PHASE 12-A] Forensic Isolation Circuit Breaker
        // "Strict Context Verification" from Remediation Plan
        const sessionUser = (req.session as any)?.user;
        let tenantId: string | null = null;
        let finalSlug = slug;

        // 2. Strict Session-URL Mismatch Check
        if (sessionUser && !req.path.includes('/auth/') && sessionUser.role !== 'SYSTEM_ADMIN' && sessionUser.role !== 'GLOBAL_ADMIN' && sessionUser.role !== 'SUPER_ADMIN') {

            // If the user attempts to access a tenant slug different from their session
            if (slug !== sessionUser.tenantSlug && slug !== 'default') {
                logger.warn({
                    userId: sessionUser.id,
                    sessionTenant: sessionUser.tenantSlug,
                    requestedTenant: slug
                }, '⛔ FORENSIC CIRCUIT BREAKER: Cross-tenant access attempted');

                return res.status(403).json({
                    error: 'Access Denied',
                    message: `You are logged into '${sessionUser.tenantSlug}' but requested '${slug}'. Please switch tenants explicitly.`
                });
            }

            tenantId = sessionUser.tenantId;
            finalSlug = sessionUser.tenantSlug;
        } else if (sessionUser?.role === 'SUPER_ADMIN' && slug !== 'default' && slug !== 'system') {
            // [ORCHESTRATION] Super Admin Drill-down Resolution
            const overrideTenant = await prisma.tenant.findUnique({ where: { slug: slug } });
            if (overrideTenant) {
                tenantId = overrideTenant.id;
                finalSlug = overrideTenant.slug;
                logger.info({ superAdmin: sessionUser.id, drillDownTenant: finalSlug }, 'Super Admin drill-down context established');
            }
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
                // [DIAGNOSTICS] Log before DB lookup
                logger.debug({ finalSlug, path: req.path }, ' attempting tenant lookup');

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
                                role: sessionUser?.role,
                                headers: req.headers // Log headers to see what's coming in
                            }, 'Tenant resolution failed - [DEPLOYMENT VERIFIED]');

                            return res.status(404).json({
                                // Unique error signature to verify deployment
                                error: `Tenant resolution failed for slug: '${finalSlug}'`,
                                context: 'Middleware Block'
                            });
                        }
                    }
                } else {
                    tenantId = tenant.id;
                }
            }
        }

        if (!tenantId) {
            // Check global route logic one last time if we somehow got here
            const isGlobalRoute = GLOBAL_KEYWORDS.some(k => req.path.includes(k));
            if (isGlobalRoute) {
                logger.info({ path: req.path }, 'Emergency system context fallback');
                tenantId = '00000000-0000-0000-0000-000000000000';
                finalSlug = 'system';
                // Don't return, let it proceed
            } else {
                logger.error({ slug: finalSlug }, 'Tenant ID could not be identified');
                return res.status(401).json({ error: 'Unauthorized: Tenant could not be identified (Fatal)' });
            }
        }

        const context: TenantContext = {
            slug: finalSlug,
            id: tenantId
        };

        // Mutation: Extend Request Object
        req.tenantId = tenantId;
        req.tenantSlug = finalSlug;

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
