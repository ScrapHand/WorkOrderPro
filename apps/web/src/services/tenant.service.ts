import { api } from "@/lib/api";

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    maxUsers: number;
    maxAdmins: number;
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

    create: async (data: { name: string, slug: string, adminEmail: string, maxUsers?: number, maxAdmins?: number }) => {
        const res = await api.post<Tenant>("/tenant", data);
        return res.data;
    },

    updateEntitlements: async (id: string, data: { plan?: string, maxUsers?: number, maxAdmins?: number }) => {
        const res = await api.patch<Tenant>(`/tenant/${id}/entitlements`, data);
        return res.data;
    },

    seedDemo: async (id: string) => {
        const res = await api.post(`/tenant/${id}/seed`);
        return res.data;
    },

    delete: async (id: string) => {
        const res = await api.delete(`/tenant/${id}`);
        return res.data;
    }
};
