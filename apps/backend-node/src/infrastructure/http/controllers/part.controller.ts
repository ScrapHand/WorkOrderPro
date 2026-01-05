import { Request, Response } from 'express';
import { PartService } from '../../../application/services/part.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { PrismaClient } from '@prisma/client';
import { hasPermission } from '../../auth/rbac.utils';

export class PartController {
    constructor(
        private partService: PartService,
        private prisma: PrismaClient
    ) { }

    create = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'inventory:write')) return res.status(403).json({ error: 'Forbidden' });

            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            // [OPTIMIZATION] Use ID from middleware
            const tenantId = tenantCtx.id;
            if (!tenantId) return res.status(400).json({ error: 'Tenant context ID missing' });

            const part = await this.partService.create(tenantId, req.body);
            res.status(201).json(part);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create part' });
        }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'inventory:read')) return res.status(403).json({ error: 'Forbidden' });

            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            // [OPTIMIZATION] Use ID from middleware
            const tenantId = tenantCtx.id;
            if (!tenantId) return res.status(400).json({ error: 'Tenant context ID missing' });

            const parts = await this.partService.getAll(tenantId);
            res.json(parts);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch parts' });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'inventory:write')) return res.status(403).json({ error: 'Forbidden' });

            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            // [OPTIMIZATION] Use ID from middleware
            const tenantId = tenantCtx.id;
            if (!tenantId) return res.status(400).json({ error: 'Tenant context ID missing' });

            const part = await this.partService.update(req.params.id, tenantId, req.body);
            res.json(part);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to update part' });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            // [STRICT] Prefer inventory:delete, fallback to inventory:write
            if (!hasPermission(req, 'inventory:delete') && !hasPermission(req, 'inventory:write')) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            // [OPTIMIZATION] Use ID from middleware
            const tenantId = tenantCtx.id;
            if (!tenantId) return res.status(400).json({ error: 'Tenant context ID missing' });

            await this.partService.delete(req.params.id, tenantId);
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to delete part' });
        }
    };
}
