
import { api } from "@/lib/api";

export interface WorkOrderComment {
    id: string;
    workOrderId: string;
    userId: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        username: string;
        avatarUrl?: string;
    };
}

export const CommentService = {
    getComments: async (workOrderId: string): Promise<WorkOrderComment[]> => {
        const { data } = await api.get<WorkOrderComment[]>(`/work-orders/${workOrderId}/comments`);
        return data;
    },

    addComment: async (workOrderId: string, content: string): Promise<WorkOrderComment> => {
        const { data } = await api.post<WorkOrderComment>(`/work-orders/${workOrderId}/comments`, { content });
        return data;
    }
};
