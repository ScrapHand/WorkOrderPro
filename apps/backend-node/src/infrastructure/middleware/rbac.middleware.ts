import { Request, Response, NextFunction } from 'express';
import { hasPermission } from '../auth/rbac.utils';

/**
 * Middleware to enforce a specific permission for a route.
 * @param permission The required permission string (e.g. 'asset:write')
 */
export const requirePermission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // 1. Authenticated?
        const user = (req.session as any)?.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: Please log in' });
        }

        // 2. Authorized?
        if (!hasPermission(req, permission)) {
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
export const requireRole = (role: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req.session as any)?.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: Please log in' });
        }

        if (user.role !== role && user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                error: 'Forbidden',
                message: `This action requires the ${role} role.`
            });
        }

        next();
    };
};
