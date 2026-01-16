import { Request, Response } from 'express';
import { ReportService } from '../../../application/services/report.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../logging/logger';

export class ReportController {
    constructor(
        private reportService: ReportService,
        private prisma: PrismaClient
    ) { }

    getWorkOrderSummary = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            const start = req.query.start ? new Date(req.query.start as string) : new Date(new Date().setDate(new Date().getDate() - 30));
            const end = req.query.end ? new Date(req.query.end as string) : new Date();

            logger.info({ tenantId, start, end }, 'Generating work order summary report');
            const summary = await this.reportService.getWorkOrderSummary(tenantId, start, end);
            res.json(summary);
        } catch (error: any) {
            logger.error({ error, tenantId }, 'Failed to generate work order summary report');
            res.status(500).json({ error: error.message });
        }
    };

    getTrends = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            logger.info({ tenantId }, 'Generating reliability trends report');
            const trends = await this.reportService.getReliabilityTrends(tenantId);
            res.json(trends);
        } catch (error: any) {
            logger.error({ error, tenantId }, 'Failed to generate reliability trends report');
            res.status(500).json({ error: error.message });
        }
    }

    getInventorySnapshot = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            logger.info({ tenantId }, 'Generating inventory snapshot report');
            const snapshot = await this.reportService.getInventorySnapshot(tenantId);
            res.json(snapshot);
        } catch (error: any) {
            logger.error({ error, tenantId }, 'Failed to generate inventory snapshot report');
            res.status(500).json({ error: error.message });
        }
    };

    getAdvancedMetrics = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            logger.info({ tenantId }, 'Generating advanced metrics report');
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
            logger.error({ error, tenantId }, 'Failed to generate advanced metrics report');
            res.status(500).json({ error: error.message });
        }
    };
}
