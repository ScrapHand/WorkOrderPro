
import { api } from "@/lib/api";
import { Part, CreatePartDTO } from "@/types/inventory";

export interface InventoryTransaction {
    id: string;
    partId: string;
    changeQuantity: number;
    type: 'IN' | 'OUT' | 'AUDIT';
    reason?: string;
    performedAt: string;
    performedBy?: string;
    part?: {
        name: string;
        sku?: string;
    };
}

export const InventoryService = {
    getAll: async (): Promise<Part[]> => {
        const { data } = await api.get<Part[]>("/parts");
        return data;
    },

    getTransactions: async (): Promise<InventoryTransaction[]> => {
        const { data } = await api.get<InventoryTransaction[]>("/parts/transactions");
        return data;
    },

    create: async (part: CreatePartDTO): Promise<Part> => {
        const { data } = await api.post<Part>("/parts", part);
        return data;
    },

    update: async (id: string, part: Partial<Part>): Promise<Part> => {
        const { data } = await api.patch<Part>(`/parts/${id}`, part);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/parts/${id}`);
    },

    getAlerts: async (): Promise<any[]> => {
        const { data } = await api.get<any[]>("/inventory/alerts");
        return data;
    }
};
