
import { api } from "@/lib/api";

export interface ShiftHandover {
    id: string;
    outgoingUserId: string;
    incomingUserId?: string;
    shiftType: string;
    status: 'PENDING' | 'SIGNED';
    content: {
        safetyNotes: string;
        activeWOs: string[];
        operationalNotes: string;
    };
    signedAt?: string;
    createdAt: string;
    outgoingUser: { username: string; email: string };
    incomingUser?: { username: string; email: string };
}

export const ShiftService = {
    getAll: async (): Promise<ShiftHandover[]> => {
        const { data } = await api.get<ShiftHandover[]>("/shifts");
        return data;
    },

    getSnapshot: async (): Promise<any[]> => {
        const { data } = await api.get<any[]>("/shifts/snapshot");
        return data;
    },

    create: async (payload: any): Promise<ShiftHandover> => {
        const { data } = await api.post<ShiftHandover>("/shifts", payload);
        return data;
    },

    sign: async (id: string): Promise<ShiftHandover> => {
        const { data } = await api.post<ShiftHandover>(`/shifts/${id}/sign`);
        return data;
    }
};
