import { Request, Response } from 'express';
import { UserService } from '../../../application/services/user.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { hasPermission } from '../../auth/rbac.utils';
import { logger } from '../../logging/logger';

export class UserController {
    constructor(private userService: UserService) { }

    create = async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;
        const tenantCtx = getCurrentTenant();
        try {
            if (!hasPermission(req, 'user:write')) {
                logger.warn({ userId: sessionUser?.id }, 'Unauthorized attempt to create user');
                return res.status(403).json({ error: 'Forbidden' });
            }

            const { email, role, password, username, tenantSlug: bodyTenantSlug } = req.body;

            // 1. Determine Target Tenant
            let targetSlug = tenantCtx?.slug || 'default';

            // Global Admin Override: If user is ADMIN of 'default' tenant, they can specify target
            if (sessionUser?.tenantSlug === 'default' && sessionUser?.role === 'ADMIN' && bodyTenantSlug) {
                targetSlug = bodyTenantSlug;
            } else if (tenantCtx?.slug !== 'default' && bodyTenantSlug && bodyTenantSlug !== tenantCtx?.slug) {
                // Security: Non-global admins cannot create users for other tenants
                logger.warn({ userId: sessionUser?.id, targetSlug: bodyTenantSlug, currentSlug: tenantCtx?.slug }, 'Denied attempt to create user in another tenant');
                return res.status(403).json({ error: 'Permission denied: Cannot create user for another tenant' });
            }

            const tenantId = await this.userService.resolveTenantId(targetSlug);
            if (!tenantId) {
                logger.error({ targetSlug }, 'Target tenant not found during user creation');
                return res.status(404).json({ error: 'Target tenant not found' });
            }

            // [NEW] Role Elevation Protection
            const restrictedRoles = ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'SYSTEM_ADMIN'];
            const isGlobalAdmin = sessionUser?.tenantSlug === 'default' && sessionUser?.role === 'ADMIN';
            const isSuperAdmin = sessionUser?.role === 'SUPER_ADMIN';

            if (restrictedRoles.includes(role)) {
                if (!isSuperAdmin && !isGlobalAdmin) {
                    logger.warn({ userId: sessionUser?.id, role }, 'Denied attempt to assign global administrative role');
                    return res.status(403).json({ error: 'Permission denied: Cannot assign global administrative roles' });
                }
            }

            // Basic validation
            if (!email) return res.status(400).json({ error: 'Email is required' });

            logger.info({ email, role, targetSlug, tenantId }, 'Creating new user');
            const user = await this.userService.createUser(tenantId, email, role || 'VIEWER', password, username);

            logger.info({ userId: user.id, email, tenantId }, 'User created successfully');
            const { passwordHash, ...safeUser } = user;
            res.status(201).json(safeUser);
        } catch (error: any) {
            logger.error({ error, email: req.body.email }, 'Failed to create user');
            if (error.code === 'P2002') {
                return res.status(409).json({ error: 'Email already exists' });
            }
            res.status(500).json({ error: error.message });
        }
    };

    update = async (req: Request, res: Response) => {
        const { id } = req.params;
        const sessionUser = (req.session as any)?.user;
        try {
            // Security: Allow if having 'user:write' OR if updating self
            const isSelf = sessionUser?.id === id;
            if (!isSelf && !hasPermission(req, 'user:write')) {
                logger.warn({ userId: sessionUser?.id, targetUserId: id }, 'Unauthorized attempt to update user');
                return res.status(403).json({ error: 'Forbidden' });
            }

            const updates = { ...req.body };

            // [NEW] Role Elevation Protection on Update
            if (updates.role) {
                const restrictedRoles = ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'SYSTEM_ADMIN'];
                const isGlobalAdmin = sessionUser?.tenantSlug === 'default' && sessionUser?.role === 'ADMIN';
                const isSuperAdmin = sessionUser?.role === 'SUPER_ADMIN';

                if (restrictedRoles.includes(updates.role)) {
                    if (!isSuperAdmin && !isGlobalAdmin) {
                        logger.warn({ userId: sessionUser?.id, role: updates.role }, 'Denied attempt to elevate user to restricted role');
                        return res.status(403).json({ error: 'Permission denied: Cannot assign global administrative roles' });
                    }
                }
            }

            logger.info({ targetUserId: id, isSelf }, 'Updating user');

            let user;
            // Handle Password Update
            if (updates.password) {
                user = await this.userService.updateUserWithPassword(id, updates);
            } else {
                user = await this.userService.updateUser(id, updates);
            }

            // [SYNC] Update session if updated user is self
            if (isSelf && (req.session as any)?.user) {
                (req.session as any).user = {
                    ...(req.session as any).user,
                    email: user.email,
                    username: user.username,
                    avatarUrl: user.avatarUrl,
                    role: user.role
                };
                req.session.save();
                logger.info({ userId: id }, 'User updated their own profile, session synced');
            }

            const { passwordHash, ...safeUser } = user;
            res.json(safeUser);
        } catch (error: any) {
            logger.error({ error, targetUserId: id }, 'Failed to update user');
            res.status(500).json({ error: error.message });
        }
    };

    delete = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            // [STRICT] Prefer user:delete, fallback to user:write
            if (!hasPermission(req, 'user:delete') && !hasPermission(req, 'user:write')) {
                logger.warn({ userId: (req.session as any)?.user?.id, targetUserId: id }, 'Unauthorized attempt to delete user');
                return res.status(403).json({ error: 'Forbidden' });
            }

            logger.info({ targetUserId: id }, 'Deleting user');
            await this.userService.deleteUser(id);
            logger.info({ targetUserId: id }, 'User deleted successfully');
            res.status(204).send();
        } catch (error: any) {
            logger.error({ error, targetUserId: id }, 'Failed to delete user');
            res.status(500).json({ error: error.message });
        }
    };

    getAll = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        try {
            if (!hasPermission(req, 'user:read')) {
                logger.warn({ userId: (req.session as any)?.user?.id }, 'Unauthorized attempt to list all users');
                return res.status(403).json({ error: 'Forbidden' });
            }

            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const tenantId = await this.userService.resolveTenantId(tenantCtx.slug);
            if (!tenantId) return res.status(404).json({ error: 'Tenant not found' });

            logger.info({ tenantId, slug: tenantCtx.slug }, 'Fetching all users for tenant');
            const users = await this.userService.getAllUsers(tenantId);
            const safeUsers = users.map(u => {
                const { passwordHash, ...rest } = u;
                return rest;
            });

            res.json(safeUsers);
        } catch (error: any) {
            logger.error({ error, tenantSlug: tenantCtx?.slug }, 'Failed to fetch all users');
            res.status(500).json({ error: error.message });
        }
    };
}
