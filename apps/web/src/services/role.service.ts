import { api } from "@/lib/api";
import { Role } from "@/types/role";

export const RoleService = {
    getAll: async (): Promise<Role[]> => {
        const res = await api.get("/roles");
        return res.data;
    },

    getById: async (id: string): Promise<Role> => {
        const res = await api.get(`/roles/${id}`);
        return res.data;
    },

    create: async (data: { name: string; description?: string; permissions: string[] }): Promise<Role> => {
        const res = await api.post("/roles", data);
        return res.data;
    },

    update: async (id: string, data: Partial<{ name: string; description: string; permissions: string[] }>): Promise<Role> => {
        const res = await api.patch(`/roles/${id}`, data);
        return res.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/roles/${id}`);
    }
};
