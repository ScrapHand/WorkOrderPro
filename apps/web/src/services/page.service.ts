import { api } from "@/lib/api";

export interface PageConfig {
    id: string;
    key: string;
    layout: any; // JSON layout config
    components: any; // JSON components config
    meta?: any;
}

export const PageService = {
    getByKey: async (key: string): Promise<PageConfig | null> => {
        try {
            const res = await api.get<PageConfig>(`/pages/${key}`);
            return res.data;
        } catch (error: any) {
            if (error.response?.status === 404) return null;
            throw error;
        }
    },

    save: async (key: string, data: Partial<PageConfig>): Promise<PageConfig> => {
        const res = await api.put<PageConfig>(`/pages/${key}`, data);
        return res.data;
    }
};
