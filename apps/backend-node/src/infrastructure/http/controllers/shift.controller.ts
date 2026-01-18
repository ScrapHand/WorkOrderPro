
import { Request, Response } from 'express';
import { ShiftService } from '../../../application/services/shift.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { logger } from '../../logging/logger';

export class ShiftController {
    constructor(private shiftService: ShiftService) { }

    create = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const user = (req.session as any)?.user;

        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            const handover = await this.shiftService.createHandover(tenantId, user.id, req.body);
            res.status(201).json(handover);
        } catch (error: any) {
            logger.error({ error: error.message, tenantId }, 'Failed to create handover');
            res.status(500).json({ error: error.message });
        }
    };

    sign = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const user = (req.session as any)?.user;
        const { id } = req.params;

        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            const handover = await this.shiftService.signHandover(id, tenantId, user.id);
            res.json(handover);
        } catch (error: any) {
            logger.error({ error: error.message, id, tenantId }, 'Failed to sign handover');
            res.status(500).json({ error: error.message });
        }
    };

    getAll = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;

        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            const handovers = await this.shiftService.getHandovers(tenantId);
            res.json(handovers);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getSnapshot = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;

        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            const snapshot = await this.shiftService.getActiveWorkOrdersSnapshot(tenantId);
            res.json(snapshot);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
