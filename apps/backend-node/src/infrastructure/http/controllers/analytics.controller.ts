import { Request, Response } from 'express';
import { AnalyticsService } from '../../../application/services/analytics.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { logger } from '../../logging/logger';

export class AnalyticsController {
    constructor(private analyticsService: AnalyticsService) { }

    getStats = async (req: Request, res: Response) => {
        const tenant = getCurrentTenant();
        try {
            if (!tenant) return res.status(400).json({ error: 'Tenant context missing' });

            logger.info({ tenantId: tenant.id, tenantSlug: tenant.slug }, 'Fetching analytics stats');
            const stats = await this.analyticsService.getStats(tenant.slug);
            res.json(stats);
        } catch (error: any) {
            logger.error({ error, tenantId: tenant?.id, tenantSlug: tenant?.slug }, 'Failed to fetch analytics stats');
            res.status(500).json({ error: 'Failed to fetch analytics' });
        }
    }
}
