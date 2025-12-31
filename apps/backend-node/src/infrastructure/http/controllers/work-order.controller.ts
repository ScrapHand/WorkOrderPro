import { Request, Response } from 'express';
import { WorkOrderService } from '../../../application/services/work-order.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { PrismaClient } from '@prisma/client';

export class WorkOrderController {
    constructor(
        private woService: WorkOrderService,
        private prisma: PrismaClient
    ) { }

    create = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            const { assetId, title, priority, description } = req.body;

            const wo = await this.woService.createWorkOrder(
                tenant.id,
                assetId,
                title,
                priority,
                description
            );

            res.status(201).json(wo);
        } catch (error: any) {
            console.error('Create WO Error:', error);
            res.status(500).json({ error: error.message });
        }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            const list = await this.woService.getWorkOrders(tenant.id);
            res.json(list);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
