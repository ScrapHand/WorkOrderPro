import { api } from "@/lib/api";

export interface ProductionLine {
    id: string;
    name: string;
    description?: string;
    assetCount?: number;
    bottleneckCount?: number;
    createdAt: string;
}

export interface AssetConnection {
    id: string;
    sourceAssetId: string;
    targetAssetId: string;
    connectionType: 'CONVEYOR' | 'SORTER' | 'DIRECT';
    speedLimit?: number;
    metadata?: any;
}

export const ProductionLineService = {
    getAll: async (): Promise<ProductionLine[]> => {
        const res = await api.get("/production-lines");
        return res.data;
    },

    getById: async (id: string): Promise<any> => {
        const res = await api.get(`/production-lines/${id}`);
        return res.data;
    },

    create: async (data: { name: string; description?: string }): Promise<ProductionLine> => {
        const res = await api.post("/production-lines", data);
        return res.data;
    },

    addConnection: async (lineId: string, data: Partial<AssetConnection>): Promise<AssetConnection> => {
        const res = await api.post(`/production-lines/${lineId}/connections`, data);
        return res.data;
    },

    analyze: async (id: string): Promise<any> => {
        const res = await api.get(`/production-lines/${id}/analyze`);
        return res.data;
    }
};
