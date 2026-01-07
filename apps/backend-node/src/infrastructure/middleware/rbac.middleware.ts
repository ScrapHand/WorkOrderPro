import { Request, Response, NextFunction } from 'express';
import { hasPermission } from '../auth/rbac.utils';

/**
 * Enum for Roles to ensure consistency
 */
export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    GLOBAL_ADMIN = 'GLOBAL_ADMIN',
    TENANT_ADMIN = 'TENANT_ADMIN',
    USER = 'USER',
    VIEWER = 'VIEWER'
}

/**
 * LOGGER UTILITY (Placeholder for actual legacy audit service)
 */
const auditLog = (req: Request, action: string, details: any) => {
    const user = (req.session as any)?.user;
    console.info(`[AUDIT] User:${user?.id || 'GUEST'} (${user?.role || 'N/A'}) | Action:${action} | Tenant:${user?.tenantId || 'NONE'} | Details:${JSON.stringify(details)}`);
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

        // Super Admin bypasses everything
        if (user?.role === UserRole.SUPER_ADMIN) {
            return next();
        }

        if (!user || !allowedRoles.includes(user.role)) {
            auditLog(req, 'UNAUTHORIZED_ROLE_ATTEMPT', {
                path: req.path,
                requiredRoles: allowedRoles,
                userRole: user?.role
            });

            return res.status(403).json({
                error: 'Forbidden',
                message: `This action requires one of the following roles: ${allowedRoles.join(', ')}.`
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

