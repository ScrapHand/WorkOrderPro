import { api } from "@/lib/api";
import { Asset, CreateAssetDTO } from "@/types/asset";
import { CreateWorkOrderDTO, WorkOrder } from "@/types/work-order";

export const AssetService = {
    create: async (data: CreateAssetDTO): Promise<Asset> => {
        const res = await api.post("/assets", data);
        return res.data;
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

    getWorkOrders: async (): Promise<WorkOrder[]> => {
        const res = await api.get("/work-orders");
        return res.data;
    },

    getWorkOrderById: async (id: string): Promise<WorkOrder> => {
        const res = await api.get(`/work-orders/${id}`);
        return res.data;
    }
};
