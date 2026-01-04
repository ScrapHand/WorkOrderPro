
import { Request, Response } from 'express';
import { AnalyticsService } from '../../../application/services/analytics.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';

export class AnalyticsController {
    constructor(private analyticsService: AnalyticsService) { }

    getStats = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant();
            if (!tenant) return res.status(400).json({ error: 'Tenant context missing' });

            const stats = await this.analyticsService.getStats(tenant.slug);
            res.json(stats);
        } catch (error: any) {
            console.error('Analytics Error:', error);
            res.status(500).json({ error: 'Failed to fetch analytics' });
        }
    }
}
