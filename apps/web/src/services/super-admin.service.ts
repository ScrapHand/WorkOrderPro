
import { api } from '../lib/api';

export interface GlobalStats {
    counters: {
        tenants: number;
        users: number;
        workOrders: number;
        assets: number;
    };
    growth: {
        newTenants30d: number;
    };
    status: string;
}

export interface TenantSummary {
    id: string;
    name: string;
    slug: string;
    plan: string;
    features: any;
    createdAt: string;
    _count: {
        users: number;
        workOrders: number;
    };
}

export const SuperAdminService = {
    getStats: async (): Promise<GlobalStats> => {
        const { data } = await api.get('/super-admin/stats');
        return data;
    },

    getTenants: async (): Promise<TenantSummary[]> => {
        const { data } = await api.get('/super-admin/tenants');
        return data;
    },

    provision: async (tenantId: string, features: any): Promise<any> => {
        const { data } = await api.post(`/super-admin/tenants/${tenantId}/provision`, { features });
        return data;
    },

    getLogs: async (): Promise<any[]> => {
        const { data } = await api.get('/super-admin/logs');
        return data;
    },

    getUsers: async (search?: string): Promise<any[]> => {
        const { data } = await api.get('/super-admin/users', { params: { search } });
        return data;
    },

    deleteUser: async (userId: string): Promise<void> => {
        await api.delete(`/super-admin/users/${userId}`);
    }
};
