import { Request, Response } from 'express';
import { RoleService } from '../../../application/services/role.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { PrismaClient } from '@prisma/client';
import { hasPermission } from '../../auth/rbac.utils';

export class RoleController {
    constructor(
        private roleService: RoleService,
        private prisma: PrismaClient // Injected for edge cases or transaction management if needed
    ) { }

    create = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'role:write')) return res.status(403).json({ error: 'Forbidden' });

            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const resolvedTenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
            if (!resolvedTenant) return res.status(404).json({ error: 'Tenant not found' });

            const { name, permissions, description } = req.body;
            if (!name) return res.status(400).json({ error: 'Role name is required' });

            const role = await this.roleService.createRole(resolvedTenant.id, name, permissions || [], description);
            res.status(201).json(role);
        } catch (error: any) {
            console.error('Create Role Error:', error);
            res.status(500).json({ error: error.message });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'role:write')) return res.status(403).json({ error: 'Forbidden' });

            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const resolvedTenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
            if (!resolvedTenant) return res.status(404).json({ error: 'Tenant not found' });

            const { id } = req.params;
            const updates = req.body; // { name, description, permissions }

            const updatedRole = await this.roleService.updateRole(id, resolvedTenant.id, updates);
            res.json(updatedRole);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'role:write')) return res.status(403).json({ error: 'Forbidden' });

            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const resolvedTenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
            if (!resolvedTenant) return res.status(404).json({ error: 'Tenant not found' });

            const { id } = req.params;
            await this.roleService.deleteRole(id, resolvedTenant.id);
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'role:read')) return res.status(403).json({ error: 'Forbidden' });

            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const resolvedTenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
            if (!resolvedTenant) return res.status(404).json({ error: 'Tenant not found' });

            const roles = await this.roleService.getRoles(resolvedTenant.id);
            res.json(roles);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getById = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'role:read')) return res.status(403).json({ error: 'Forbidden' });

            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const resolvedTenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
            if (!resolvedTenant) return res.status(404).json({ error: 'Tenant not found' });

            const { id } = req.params;
            const role = await this.roleService.getRoleById(id, resolvedTenant.id);
            res.json(role);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
