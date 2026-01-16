import { Request } from 'express';

export function hasPermission(req: Request, requiredPermission: string): boolean {
    const user = (req.session as any)?.user;

    if (!user) {
        console.warn(`[RBAC] No user in session for request to ${req.path}`);
        return false;
    }

    console.log(`[RBAC] Check: User=${user.email}, Role=${user.role}, Permission=${requiredPermission}`);

    // God Mode
    if (user.role === 'SUPER_ADMIN' || user.role === 'GLOBAL_ADMIN') {
        console.log(`[RBAC] Bypass granted for ${user.role}`);
        return true;
    }

    if (!user.permissions) {
        console.warn(`[RBAC] User ${user.email} has no permissions array in session`);
        return false;
    }

    const hasit = user.permissions.includes('*') || user.permissions.includes(requiredPermission);
    if (!hasit) {
        console.warn(`[RBAC] Access Denied: User ${user.email} missing ${requiredPermission}. Permissions: ${user.permissions}`);
    }

    return hasit;
}
