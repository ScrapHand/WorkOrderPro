import { Request, Response } from 'express';
import { UserService } from '../../../application/services/user.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { hasPermission } from '../../auth/rbac.utils';

export class UserController {
    constructor(private userService: UserService) { }

    create = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'user:write')) return res.status(403).json({ error: 'Forbidden' });

            const sessionUser = (req.session as any).user;
            const tenantCtx = getCurrentTenant();
            const { email, role, password, username, tenantSlug: bodyTenantSlug } = req.body;

            // 1. Determine Target Tenant
            let targetSlug = tenantCtx?.slug || 'default';

            // Global Admin Override: If user is ADMIN of 'default' tenant, they can specify target
            if (sessionUser?.tenantSlug === 'default' && sessionUser?.role === 'ADMIN' && bodyTenantSlug) {
                targetSlug = bodyTenantSlug;
            } else if (tenantCtx?.slug !== 'default' && bodyTenantSlug && bodyTenantSlug !== tenantCtx?.slug) {
                // Security: Non-global admins cannot create users for other tenants
                return res.status(403).json({ error: 'Permission denied: Cannot create user for another tenant' });
            }

            const tenantId = await this.userService.resolveTenantId(targetSlug);
            if (!tenantId) return res.status(404).json({ error: 'Target tenant not found' });

            // Basic validation
            if (!email) return res.status(400).json({ error: 'Email is required' });

            const user = await this.userService.createUser(tenantId, email, role || 'VIEWER', password, username);

            // Return user without password hash
            const { passwordHash, ...safeUser } = user;
            res.status(201).json(safeUser);
        } catch (error: any) {
            console.error('Create User Error:', error);
            if (error.code === 'P2002') {
                return res.status(409).json({ error: 'Email already exists' });
            }
            res.status(500).json({ error: error.message });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'user:write')) return res.status(403).json({ error: 'Forbidden' });

            const { id } = req.params;
            const updates = { ...req.body };

            // Handle Password Update
            if (updates.password) {
                // We need to bypass the Service's generic update which ignores 'password'
                // Actually, let's just use the service's update pass method if needed or do it here.
                // Cleaner: Update the service to handle it or separate.
                // Let's do it here for now to save a trip, or import bcrypt.
                // Better: rely on service.
                const user = await this.userService.updateUserWithPassword(id, updates);
                const { passwordHash, ...safeUser } = user;
                return res.json(safeUser);
            }

            const user = await this.userService.updateUser(id, updates);
            const { passwordHash, ...safeUser } = user;
            res.json(safeUser);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            // [STRICT] Prefer user:delete, fallback to user:write
            if (!hasPermission(req, 'user:delete') && !hasPermission(req, 'user:write')) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            const { id } = req.params;
            await this.userService.deleteUser(id);
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'user:read')) return res.status(403).json({ error: 'Forbidden' });

            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const tenantId = await this.userService.resolveTenantId(tenantCtx.slug);
            if (!tenantId) return res.status(404).json({ error: 'Tenant not found' });

            const users = await this.userService.getAllUsers(tenantId);
            const safeUsers = users.map(u => {
                const { passwordHash, ...rest } = u;
                return rest;
            });

            res.json(safeUsers);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
