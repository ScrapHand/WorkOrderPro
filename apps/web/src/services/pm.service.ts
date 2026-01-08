import { api } from "@/lib/api";

export interface PMSchedule {
    id: string;
    assetId: string;
    title: string;
    description?: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    startDate: string;
    nextDueDate: string;
    active: boolean;
    checklistTemplateId?: string;
    asset?: { name: string };
    checklistTemplate?: { name: string };
}

export interface ChecklistTemplate {
    id: string;
    name: string;
    description?: string;
    items: ChecklistItemTemplate[];
}

export interface ChecklistItemTemplate {
    id: string;
    task: string;
    isRequired: boolean;
    order: number;
}

export interface WorkOrderChecklist {
    id: string;
    workOrderId: string;
    items: WorkOrderChecklistItem[];
}

export interface WorkOrderChecklistItem {
    id: string;
    task: string;
    isCompleted: boolean;
    completedAt?: string;
    completedBy?: string;
    order: number;
}

export const PMService = {
    // Schedules
    getSchedules: async (): Promise<PMSchedule[]> => {
        const { data } = await api.get('/pm/schedules');
        return data;
    },
    createSchedule: async (data: Partial<PMSchedule>): Promise<PMSchedule> => {
        const { data: response } = await api.post('/pm/schedules', data);
        return response;
    },

    // Templates
    getTemplates: async (): Promise<ChecklistTemplate[]> => {
        const { data } = await api.get('/pm/templates');
        return data;
    },
    createTemplate: async (data: any): Promise<ChecklistTemplate> => {
        const { data: response } = await api.post('/pm/templates', data);
        return response;
    },

    // Checklists
    getWorkOrderChecklist: async (workOrderId: string): Promise<WorkOrderChecklist> => {
        const { data } = await api.get(`/pm/checklists/${workOrderId}`);
        return data;
    },
    signOffItem: async (itemId: string, isCompleted: boolean): Promise<WorkOrderChecklistItem> => {
        const { data } = await api.post(`/pm/checklists/sign-off/${itemId}`, { isCompleted });
        return data;
    },

    // Utilities
    triggerPMs: async (): Promise<{ message: string }> => {
        const { data } = await api.post('/pm/trigger');
        return data;
    },
    triggerSchedule: async (id: string): Promise<any> => {
        const { data } = await api.post(`/pm/schedules/${id}/trigger`);
        return data;
    }
};
