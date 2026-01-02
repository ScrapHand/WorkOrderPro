import { api } from "@/lib/api";
import { Asset, CreateAssetDTO } from "@/types/asset";
import { CreateWorkOrderDTO, WorkOrder } from "@/types/work-order";

export const AssetService = {
    create: async (data: CreateAssetDTO): Promise<Asset> => {
        const res = await api.post("/assets", data);
        return res.data;
    },

    update: async (id: string, data: Partial<CreateAssetDTO>): Promise<Asset> => {
        const res = await api.put(`/assets/${id}`, data);
        return res.data;
    },

    saveLayout: async (layout: Record<string, { x: number, y: number }>, scope: 'global' | 'user' = 'user'): Promise<void> => {
        await api.post("/assets/layout", { layout, scope });
    },

    getTree: async (rootId: string): Promise<Asset[]> => {
        const res = await api.get(`/assets/${rootId}/tree`);
        return res.data;
    },

    getAll: async (): Promise<Asset[]> => {
        const res = await api.get("/assets");
        return res.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/assets/${id}`);
    },

    createWorkOrder: async (data: CreateWorkOrderDTO): Promise<WorkOrder> => {
        // Priority should be string in DTO if API accepts string, but logic handled.
        const res = await api.post("/work-orders", data);
        return res.data;
    },

    getWorkOrders: async (status?: string): Promise<WorkOrder[]> => {
        const res = await api.get("/work-orders", {
            params: status ? { status } : undefined
        });
        return res.data;
    },

    getWorkOrderById: async (id: string): Promise<WorkOrder> => {
        const res = await api.get(`/work-orders/${id}`);
        return res.data;
    },

    deleteWorkOrder: async (id: string): Promise<void> => {
        await api.delete(`/work-orders/${id}`);
    }
};
