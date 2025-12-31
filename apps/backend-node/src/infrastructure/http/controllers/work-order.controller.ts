import { Request, Response } from 'express';
import { WorkOrderService } from '../../../application/services/work-order.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';

export class WorkOrderController {
    constructor(private woService: WorkOrderService) { }

    create = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant();
            if (!tenant) return res.status(400).json({ error: 'Tenant context missing' });

            const { assetId, title, priority, description } = req.body;

            const wo = await this.woService.createWorkOrder(
                tenant.slug,
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
            const tenant = getCurrentTenant();
            if (!tenant) return res.status(400).json({ error: 'Tenant context missing' });

            const list = await this.woService.getWorkOrders(tenant.slug);
            res.json(list);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
