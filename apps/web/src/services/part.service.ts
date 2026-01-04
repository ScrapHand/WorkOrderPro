import { api } from "@/lib/api";

export interface Part {
    id: string;
    sku: string | null;
    name: string;
    description: string | null;
    cost: number;
    currency: string;
    quantity: number;
    minQuantity: number;
    binLocation: string | null;
    imageUrl: string | null;
}

export const PartService = {
    getAll: async () => {
        const res = await api.get<Part[]>("/parts");
        return res.data;
    },

    getById: async (id: string) => {
        const res = await api.get<Part>(`/parts/${id}`);
        return res.data;
    }
};
