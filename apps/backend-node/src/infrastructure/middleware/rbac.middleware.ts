import { Request, Response, NextFunction } from 'express';
import { hasPermission } from '../auth/rbac.utils';
import { prisma } from '../database/prisma';
import { getCurrentTenant } from './tenant.middleware';

/**
 * Enum for Roles to ensure consistency
 */
export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    GLOBAL_ADMIN = 'GLOBAL_ADMIN',
    TENANT_ADMIN = 'TENANT_ADMIN',
    ADMIN = 'ADMIN',
    TECHNICIAN = 'TECHNICIAN',
    USER = 'USER',
    VIEWER = 'VIEWER'
}

/**
 * ROLE WEIGHTS (Blueprint Hierarchy)
 */
export const ROLE_WEIGHTS: Record<string, number> = {
    [UserRole.GLOBAL_ADMIN]: 100,
    [UserRole.SUPER_ADMIN]: 80,
    [UserRole.TENANT_ADMIN]: 60,
    [UserRole.ADMIN]: 40,
    [UserRole.TECHNICIAN]: 20,
    [UserRole.USER]: 10,
    [UserRole.VIEWER]: 5
};

/**
 * REAL AUDIT LOGGING
 * Persists critical security events to the database.
 */
const auditLog = async (req: Request, event: string, details: any) => {
    const user = (req.session as any)?.user;
    const tenantId = getCurrentTenant()?.id || user?.tenantId;

    // Log to console for immediate visibility
    console.info(`[AUDIT] User:${user?.id || 'GUEST'} | Tenant:${tenantId} | Event:${event} | Details:${JSON.stringify(details)}`);

    try {
        await prisma.auditLog.create({
            data: {
                tenantId: tenantId || null,
                userId: user?.id || null,
                event,
                resource: details.resource || 'SYSTEM',
                resourceId: details.resourceId || null,
                metadata: {
                    ...details,
                    ip: req.ip,
                    userAgent: req.headers['user-agent']
                }
            }
        });
    } catch (error) {
        console.error('[RBAC] Audit logging failed:', error);
    }
};

/**
 * MIDDLEWARE 1: requireAuth
 * Strictly checks for the existence of a valid session.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !(req.session as any).user) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Valid session required. Please log in.'
        });
    }
    next();
};

/**
 * MIDDLEWARE 2: requireTenantContext
 * Ensures the user has a valid tenant association.
 */
export const requireTenantContext = (req: Request, res: Response, next: NextFunction) => {
    const user = (req.session as any).user;
    if (!user?.tenantId && user?.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'User is not associated with a valid tenant context.'
        });
    }
    next();
};

/**
 * MIDDLEWARE 3: requirePermission
 * Middleware to enforce a specific permission for a route.
 */
export const requirePermission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!hasPermission(req, permission)) {
            auditLog(req, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
                path: req.path,
                requiredPermission: permission
            });

            return res.status(403).json({
                error: 'Forbidden',
                message: `You do not have the required permission: ${permission}`
            });
        }

        next();
    };
};

/**
 * Middleware to enforce a specific role for a route.
 * Primarily for system-level roles like SUPER_ADMIN.
 */
export const requireRole = (role: string | string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req.session as any)?.user;
        const allowedRoles = Array.isArray(role) ? role : [role];

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
        }

        // Determine the minimum weight required for access
        const requiredWeight = Math.min(...allowedRoles.map(r => ROLE_WEIGHTS[r] || 0));
        const userWeight = ROLE_WEIGHTS[user.role] || 0;

        // PLATFORM HARDENING: If GLOBAL_ADMIN is in allowedRoles, only users with weight >= 100 can enter
        // This ensures SUPER_ADMIN (80) cannot perform platform-level actions.
        if (userWeight < requiredWeight) {
            auditLog(req, 'UNAUTHORIZED_ROLE_ATTEMPT', {
                path: req.path,
                requiredRoles: allowedRoles,
                userRole: user.role,
                weightMismatch: { userWeight, requiredWeight }
            });

            return res.status(403).json({
                error: 'Forbidden',
                message: `This action requires ${allowedRoles.join(' or ')} or higher privileges.`
            });
        }

        // Log privileged actions for non-GET requests
        if (req.method !== 'GET') {
            auditLog(req, 'PRIVILEGED_ACTION', { method: req.method, path: req.path });
        }

        next();
    };
};

/**
 * COMPOSITE MIDDLEWARES
 */
export const protectTenantAdminRoute = [requireAuth, requireTenantContext, requireRole(UserRole.TENANT_ADMIN)];
export const protectStandardRoute = [requireAuth, requireTenantContext];

