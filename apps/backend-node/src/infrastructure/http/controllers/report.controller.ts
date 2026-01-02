import { Request, Response } from 'express';
import { ReportService } from '../../../application/services/report.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { PrismaClient } from '@prisma/client';

export class ReportController {
    constructor(
        private reportService: ReportService,
        private prisma: PrismaClient
    ) { }

    getWorkOrderSummary = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            const start = req.query.start ? new Date(req.query.start as string) : new Date(new Date().setDate(new Date().getDate() - 30));
            const end = req.query.end ? new Date(req.query.end as string) : new Date();

            const summary = await this.reportService.getWorkOrderSummary(tenant.id, start, end);
            res.json(summary);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getInventorySnapshot = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            const snapshot = await this.reportService.getInventorySnapshot(tenant.id);
            res.json(snapshot);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
