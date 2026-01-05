import { Request, Response } from 'express';
import { WorkOrderService } from '../../../application/services/work-order.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { PrismaClient } from '@prisma/client';
import { hasPermission } from '../../auth/rbac.utils';

export class WorkOrderController {
    constructor(
        private woService: WorkOrderService,
        private prisma: PrismaClient
    ) { }

    create = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'work_order:write')) return res.status(403).json({ error: 'Forbidden' });

            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            // [OPTIMIZATION] Use ID from middleware
            const tenantId = tenantCtx.id;
            if (!tenantId) return res.status(400).json({ error: 'Tenant context ID missing' });

            const { assetId, title, priority, description, assignedUserId } = req.body;
            console.log('[WorkOrderController] Create Request:', { assetId, title, priority, assignedUserId });

            const wo = await this.woService.createWorkOrder(
                tenantId,
                assetId,
                title,
                priority,
                description,
                assignedUserId
            );

            res.status(201).json(wo);
        } catch (error: any) {
            console.error('Create WO Error:', error);
            res.status(500).json({ error: error.message });
        }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'work_order:read')) return res.status(403).json({ error: 'Forbidden' });

            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            // [OPTIMIZATION] Use ID from middleware
            const tenantId = tenantCtx.id;
            if (!tenantId) return res.status(400).json({ error: 'Tenant context ID missing' });

            const filters = {
                status: req.query.status as string | undefined,
                assetId: req.query.assetId as string | undefined,
                priority: req.query.priority as string | undefined,
                rootAssetId: req.query.rootAssetId as string | undefined, // For Group/Zone filtering
                from: req.query.from as string | undefined,
                to: req.query.to as string | undefined
            };

            const list = await this.woService.getWorkOrders(tenantId, filters);
            res.json(list);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getById = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'work_order:read')) return res.status(403).json({ error: 'Forbidden' });

            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            // [OPTIMIZATION] Use ID from middleware
            const tenantId = tenantCtx.id;
            if (!tenantId) return res.status(400).json({ error: 'Tenant context ID missing' });

            const wo = await this.woService.getWorkOrderById(req.params.id, tenantId);
            if (!wo) return res.status(404).json({ error: 'Work order not found' });

            res.json(wo);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    patch = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'work_order:write')) return res.status(403).json({ error: 'Forbidden' });

            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            // [OPTIMIZATION] Use ID from middleware
            const tenantId = tenantCtx.id;
            if (!tenantId) return res.status(400).json({ error: 'Tenant context ID missing' });

            const { id } = req.params;
            const updates = req.body;

            const wo = await this.woService.updateWorkOrder(id, tenantId, updates);
            res.json(wo);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'work_order:delete')) return res.status(403).json({ error: 'Forbidden' });

            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            // [OPTIMIZATION] Use ID from middleware
            const tenantId = tenantCtx.id;
            if (!tenantId) return res.status(400).json({ error: 'Tenant context ID missing' });

            await this.woService.deleteWorkOrder(req.params.id, tenantId);
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
