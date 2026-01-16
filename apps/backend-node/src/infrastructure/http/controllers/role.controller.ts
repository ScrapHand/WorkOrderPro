import { Request, Response } from 'express';
import { RoleService } from '../../../application/services/role.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { PrismaClient } from '@prisma/client';
import { hasPermission } from '../../auth/rbac.utils';
import { logger } from '../../logging/logger';

export class RoleController {
    constructor(
        private roleService: RoleService,
        private prisma: PrismaClient
    ) { }

    create = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!hasPermission(req, 'role:write')) {
                logger.warn({ userId: (req.session as any)?.user?.id, tenantId }, 'Unauthorized attempt to create role');
                return res.status(403).json({ error: 'Forbidden' });
            }

            if (!tenantCtx || !tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            const { name, permissions, description } = req.body;
            if (!name) return res.status(400).json({ error: 'Role name is required' });

            logger.info({ tenantId, name }, 'Creating new custom role');
            const role = await this.roleService.createRole(tenantId, name, permissions || [], description);

            logger.info({ roleId: role.id, tenantId }, 'Role created successfully');
            res.status(201).json(role);
        } catch (error: any) {
            logger.error({ error, tenantId }, 'Failed to create role');
            res.status(500).json({ error: error.message });
        }
    };

    update = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { id } = req.params;
        try {
            if (!hasPermission(req, 'role:write')) {
                logger.warn({ userId: (req.session as any)?.user?.id, roleId: id, tenantId }, 'Unauthorized attempt to update role');
                return res.status(403).json({ error: 'Forbidden' });
            }

            if (!tenantCtx || !tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            const updates = req.body;

            logger.info({ roleId: id, tenantId }, 'Updating custom role');
            const updatedRole = await this.roleService.updateRole(id, tenantId, updates);

            res.json(updatedRole);
        } catch (error: any) {
            logger.error({ error, roleId: id, tenantId }, 'Failed to update role');
            res.status(500).json({ error: error.message });
        }
    };

    delete = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { id } = req.params;
        try {
            if (!hasPermission(req, 'role:write')) {
                logger.warn({ userId: (req.session as any)?.user?.id, roleId: id, tenantId }, 'Unauthorized attempt to delete role');
                return res.status(403).json({ error: 'Forbidden' });
            }

            if (!tenantCtx || !tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            logger.info({ roleId: id, tenantId }, 'Deleting custom role');
            await this.roleService.deleteRole(id, tenantId);

            logger.info({ roleId: id, tenantId }, 'Role deleted successfully');
            res.status(204).send();
        } catch (error: any) {
            logger.error({ error, roleId: id, tenantId }, 'Failed to delete role');
            res.status(500).json({ error: error.message });
        }
    };

    getAll = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!hasPermission(req, 'role:read')) return res.status(403).json({ error: 'Forbidden' });

            if (!tenantCtx || !tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            const roles = await this.roleService.getRoles(tenantId);
            res.json(roles);
        } catch (error: any) {
            logger.error({ error, tenantId }, 'Failed to fetch all roles');
            res.status(500).json({ error: error.message });
        }
    };

    getById = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { id } = req.params;
        try {
            if (!hasPermission(req, 'role:read')) return res.status(403).json({ error: 'Forbidden' });

            if (!tenantCtx || !tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            const role = await this.roleService.getRoleById(id, tenantId);
            res.json(role);
        } catch (error: any) {
            logger.error({ error, roleId: id, tenantId }, 'Failed to fetch role by ID');
            res.status(500).json({ error: error.message });
        }
    };
}
