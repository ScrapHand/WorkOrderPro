import { Request } from 'express';

export function hasPermission(req: Request, requiredPermission: string): boolean {
    const user = (req.session as any)?.user;
    if (!user) return false;

    // God Mode
    if (user.role === 'SUPER_ADMIN' || user.role === 'GLOBAL_ADMIN') return true;

    // Admin usually has all access within tenant, but let's stick to permissions if possible.
    // However, for safety, if permissions are missing but role is ADMIN, we might want to allow?
    // NO, we want STRICT permission checks.
    // Exception: If the user has a '*' permission (which Admins should have in their seed).

    if (user.permissions?.includes('*')) return true;

    return user.permissions?.includes(requiredPermission) || false;
}
