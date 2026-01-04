
import { PrismaClient } from '@prisma/client';

export class AnalyticsService {
    constructor(private prisma: PrismaClient) { }

    async getStats(tenantSlug: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug: tenantSlug }
        });

        if (!tenant) throw new Error('Tenant not found');
        const tenantId = tenant.id;

        const [
            totalWorkOrders,
            completedWorkOrders,
            lowStockItems,
            totalAssets
        ] = await Promise.all([
            this.prisma.workOrder.count({ where: { tenantId } }),
            this.prisma.workOrder.count({ where: { tenantId, status: 'COMPLETED' } }),
            this.prisma.part.count({ where: { tenantId, quantity: { lt: 10 } } }),
            this.prisma.asset.count({ where: { tenantId } })
        ]);

        return {
            totalWorkOrders,
            completedWorkOrders,
            lowStockItems,
            totalAssets
        };
    }
}
