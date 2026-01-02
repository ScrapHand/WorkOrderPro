import { api } from "@/lib/api";
import { InventoryItem, CreateInventoryItemDTO } from "@/types/inventory";

export const InventoryService = {
    list: async (): Promise<InventoryItem[]> => {
        const res = await api.get("/inventory");
        return res.data;
    },

    create: async (data: CreateInventoryItemDTO): Promise<InventoryItem> => {
        const res = await api.post("/inventory", data);
        return res.data;
    },

    update: async (id: string, data: Partial<CreateInventoryItemDTO>): Promise<InventoryItem> => {
        const res = await api.put(`/inventory/${id}`, data);
        return res.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/inventory/${id}`);
    }
};
