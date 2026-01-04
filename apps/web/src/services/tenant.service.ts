import { api } from "@/lib/api";

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    _count?: {
        users: number;
        assets: number;
        workOrders: number;
    }
}

export const TenantService = {
    getAll: async () => {
        const res = await api.get<Tenant[]>("/tenant"); // Mounted at /api/v1/tenant
        return res.data;
    },

    create: async (data: { name: string, slug: string, adminEmail: string }) => {
        const res = await api.post<Tenant>("/tenant", data);
        return res.data;
    },

    seedDemo: async (id: string) => {
        const res = await api.post(`/tenant/${id}/seed`);
        return res.data;
    }
};
