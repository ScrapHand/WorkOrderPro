import { api } from "@/lib/api";

export interface WOSummary {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    avgRime: number;
}

export interface InventorySnapshot {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    items: Array<{
        name: string;
        quantity: number;
        status: 'OUT' | 'LOW' | 'OK';
    }>;
}

export interface AdvancedMetrics {
    pmCompliance: {
        score: number;
        total: number;
        preventive: number;
        reactive: number;
    };
    costByManufacturer: Array<{
        manufacturer: string;
        totalCost: number;
        count: number;
    }>;
    mtbf: Array<{
        assetId: string;
        assetName: string;
        mtbfDays: number;
        failureCount: number;
    }>;
    mttr: {
        averageMinutes: number;
        totalWorkOrders: number;
    };
}

export interface ReliabilityTrend {
    history: {
        month: string;
        failures: number;
        mttr: number;
    }[];
    mtbfTrend: number;
    mttrTrend: number;
}

export const ReportService = {
    getWorkOrderSummary: async (start?: string, end?: string): Promise<WOSummary> => {
        const res = await api.get("/v1/reports/work-orders", {
            params: { start, end }
        });
        return res.data;
    },

    getInventorySnapshot: async (): Promise<InventorySnapshot> => {
        const res = await api.get("/v1/reports/inventory");
        return res.data;
    },

    getAdvancedMetrics: async () => {
        const response = await api.get<AdvancedMetrics>('/v1/reports/advanced');
        return response.data;
    },

    getTrends: async () => {
        const response = await api.get<ReliabilityTrend>('/v1/reports/trends');
        return response.data;
    }
};
