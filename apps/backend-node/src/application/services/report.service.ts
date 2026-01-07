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
        const items = await this.prisma.part.findMany({
            where: { tenantId }
        });

        return {
            totalItems: items.length,
            lowStockItems: items.filter(i => i.quantity <= i.minQuantity).length,
            outOfStockItems: items.filter(i => i.quantity === 0).length,
            totalValue: items.reduce((acc, curr) => acc + (curr.cost * curr.quantity), 0),
            items: items.map(i => ({
                name: i.name,
                quantity: i.quantity,
                status: i.quantity === 0 ? 'OUT' : i.quantity <= i.minQuantity ? 'LOW' : 'OK'
            }))
        };
    }

    async getPMCompliance(tenantId: string) {
        // Blueprint: Ratio of Completed PMs vs Total Scheduled PMs
        const result: any[] = await this.prisma.$queryRaw`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'DONE') as completed,
                COUNT(*) as total
            FROM "WorkOrder"
            WHERE "tenant_id" = ${tenantId} AND "type" = 'PREVENTIVE'
        `;

        const { completed, total } = result[0];
        const score = total > 0 ? Math.round((Number(completed) / Number(total)) * 100) : 100;

        return {
            preventive: Number(completed),
            totalScheduled: Number(total),
            score
        };
    }

    async getCostByManufacturer(tenantId: string) {
        // Blueprint: JOIN WorkOrder to Asset. GROUP BY Asset.manufacturer. SUM WorkOrder parts/costs.
        // We'll approximate with WorkOrderPart totals associated with assets of a manufacturer
        const results: any[] = await this.prisma.$queryRaw`
            SELECT 
                COALESCE(CAST(a.specs->>'manufacturer' AS TEXT), 'Unknown') as manufacturer,
                SUM(wp.quantity_used * wp.cost_at_time) as "totalCost",
                COUNT(DISTINCT wo.id) as "count"
            FROM "Asset" a
            LEFT JOIN "WorkOrder" wo ON wo.asset_id = a.id
            LEFT JOIN "WorkOrderPart" wp ON wp.work_order_id = wo.id
            WHERE a.tenant_id = ${tenantId}
            GROUP BY 1
            ORDER BY "totalCost" DESC
        `;

        return results.map(r => ({
            manufacturer: r.manufacturer,
            totalCost: Number(r.totalCost || 0),
            count: Number(r.count || 0)
        }));
    }

    async getMTBFMetrics(tenantId: string) {
        /**
         * Blueprint: MTBF = (Total Hours - Sum(Downtime)) / Count(Failures)
         * We measure over the last 30 days for the "current" MTBF.
         */
        const days = 30;
        const totalHours = days * 24;

        const results: any[] = await this.prisma.$queryRaw`
            SELECT 
                a.id as "assetId",
                a.name as "assetName",
                COUNT(wo.id) as "failureCount",
                SUM(EXTRACT(EPOCH FROM (wo.completed_at - wo."createdAt")) / 3600) as "totalDowntimeHours"
            FROM "Asset" a
            JOIN "WorkOrder" wo ON wo.asset_id = a.id
            WHERE a.tenant_id = ${tenantId} 
              AND wo.type = 'REACTIVE' 
              AND wo.status = 'DONE'
              AND wo.completed_at > NOW() - INTERVAL '30 days'
            GROUP BY a.id, a.name
        `;

        return results.map(r => {
            const downtime = Number(r.totalDowntimeHours || 0);
            const failures = Number(r.failureCount || 0);
            const uptime = totalHours - downtime;

            // If uptime is negative (bad data), default to 0
            const mtbfHours = failures > 0 ? Math.max(0, uptime) / failures : totalHours;
            const mtbfDays = Math.round(mtbfHours / 24);

            return {
                assetId: r.assetId,
                assetName: r.assetName,
                mtbfDays,
                failureCount: failures
            };
        });
    }

    async getReliabilityTrends(tenantId: string) {
        /**
         * Blueprint: "A trend line showing whether reliability is improving... over the last 12 months."
         * We'll fetch failure counts and MTTR per month for the last 12 months.
         */
        const trends: any[] = await this.prisma.$queryRaw`
            WITH monthly_data AS (
                SELECT 
                    date_trunc('month', wo.completed_at) as month,
                    COUNT(wo.id) as failure_count,
                    AVG(EXTRACT(EPOCH FROM (wo.completed_at - wo."createdAt")) / 3600) as avg_mttr_hours
                FROM "WorkOrder" wo
                WHERE wo.tenant_id = ${tenantId}
                  AND wo.type = 'REACTIVE'
                  AND wo.status = 'DONE'
                  AND wo.completed_at > NOW() - INTERVAL '12 months'
                GROUP BY 1
                ORDER BY 1 ASC
            )
            SELECT 
                month,
                failure_count as "failureCount",
                ROUND(CAST(avg_mttr_hours * 60 AS NUMERIC), 0) as "mttrMinutes"
            FROM monthly_data
        `;

        // Calculate MoM for MTBF (inverse of failure count trend) and MTTR
        let mtbfTrend = 0;
        let mttrTrend = 0;

        if (trends.length >= 2) {
            const current = trends[trends.length - 1];
            const previous = trends[trends.length - 2];

            // MTBF Trend %: (Previous Failures - Current Failures) / Previous Failures * 100
            // Since less failures = better MTBF
            if (previous.failureCount > 0) {
                mtbfTrend = Math.round(((previous.failureCount - current.failureCount) / previous.failureCount) * 100);
            }

            // MTTR Trend %: (Previous MTTR - Current MTTR) / Previous MTTR * 100
            // Since lower MTTR = better
            if (previous.mttrMinutes > 0) {
                mttrTrend = Math.round(((previous.mttrMinutes - current.mttrMinutes) / previous.mttrMinutes) * 100);
            }
        }

        return {
            history: trends.map(t => ({
                month: new Date(t.month).toLocaleString('default', { month: 'short' }),
                failures: Number(t.failureCount),
                mttr: Number(t.mttrMinutes)
            })),
            mtbfTrend,
            mttrTrend
        };
    }
    async getMTTRMetrics(tenantId: string) {
        const results = await this.prisma.workOrder.findMany({
            where: {
                tenantId,
                status: 'DONE',
                completedAt: { not: null }
            },
            select: {
                createdAt: true,
                completedAt: true
            }
        });

        if (results.length === 0) return { averageMinutes: 0, totalWorkOrders: 0 };

        const totalMinutes = results.reduce((acc, curr) => {
            const start = new Date(curr.createdAt).getTime();
            const end = new Date(curr.completedAt!).getTime();
            return acc + (end - start) / (1000 * 60);
        }, 0);

        return {
            averageMinutes: Math.round(totalMinutes / results.length),
            totalWorkOrders: results.length
        };
    }
}
