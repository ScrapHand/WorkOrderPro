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
            const sessionUser = (req.session as any)?.user;
            const tenantId = sessionUser?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            const start = req.query.start ? new Date(req.query.start as string) : new Date(new Date().setDate(new Date().getDate() - 30));
            const end = req.query.end ? new Date(req.query.end as string) : new Date();

            const summary = await this.reportService.getWorkOrderSummary(tenantId, start, end);
            res.json(summary);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getTrends = async (req: Request, res: Response) => {
        try {
            const tenantId = (req.session as any)?.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            const trends = await this.reportService.getReliabilityTrends(tenantId);
            res.json(trends);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    getInventorySnapshot = async (req: Request, res: Response) => {
        try {
            const sessionUser = (req.session as any)?.user;
            const tenantId = sessionUser?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            const snapshot = await this.reportService.getInventorySnapshot(tenantId);
            res.json(snapshot);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getAdvancedMetrics = async (req: Request, res: Response) => {
        try {
            const sessionUser = (req.session as any)?.user;
            const tenantId = sessionUser?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            const [pmCompliance, costByManufacturer, mtbf, mttr] = await Promise.all([
                this.reportService.getPMCompliance(tenantId),
                this.reportService.getCostByManufacturer(tenantId),
                this.reportService.getMTBFMetrics(tenantId),
                this.reportService.getMTTRMetrics(tenantId)
            ]);

            res.json({
                pmCompliance,
                costByManufacturer,
                mtbf,
                mttr
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
