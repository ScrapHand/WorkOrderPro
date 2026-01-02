import { PrismaClient } from '@prisma/client';

export class ReportService {
    constructor(private prisma: PrismaClient) { }

    async getWorkOrderSummary(tenantId: string, startDate: Date, endDate: Date) {
        const results = await this.prisma.workOrder.findMany({
            where: {
                tenantId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                status: true,
                priority: true,
                rimeScore: true
            }
        });

        const summary = {
            total: results.length,
            byStatus: results.reduce((acc: any, curr) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
            }, {}),
            byPriority: results.reduce((acc: any, curr) => {
                acc[curr.priority] = (acc[curr.priority] || 0) + 1;
                return acc;
            }, {}),
            avgRime: results.length > 0
                ? results.reduce((acc, curr) => acc + curr.rimeScore, 0) / results.length
                : 0
        };

        return summary;
    }

    async getInventorySnapshot(tenantId: string) {
        const items = await this.prisma.inventoryItem.findMany({
            where: { tenantId }
        });

        return {
            totalItems: items.length,
            lowStockItems: items.filter(i => i.quantity <= i.threshold).length,
            outOfStockItems: items.filter(i => i.quantity === 0).length,
            totalValue: 0, // Placeholder if price is added later
            items: items.map(i => ({
                name: i.name,
                quantity: i.quantity,
                status: i.quantity === 0 ? 'OUT' : i.quantity <= i.threshold ? 'LOW' : 'OK'
            }))
        };
    }
}
