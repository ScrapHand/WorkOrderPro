
import { api } from "@/lib/api";

export interface AnalyticsStats {
    totalWorkOrders: number;
    completedWorkOrders: number;
    lowStockItems: number;
    totalAssets: number;
}

export const AnalyticsService = {
    getStats: async (): Promise<AnalyticsStats> => {
        const res = await api.get("/analytics/stats");
        return res.data;
    }
};
