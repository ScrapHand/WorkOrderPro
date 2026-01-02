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

export const ReportService = {
    getWorkOrderSummary: async (start?: string, end?: string): Promise<WOSummary> => {
        const res = await api.get("/reports/work-orders", {
            params: { start, end }
        });
        return res.data;
    },

    getInventorySnapshot: async (): Promise<InventorySnapshot> => {
        const res = await api.get("/reports/inventory");
        return res.data;
    }
};
