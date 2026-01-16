import { Asset } from './asset';

import { WorkOrderPriority, WorkOrderStatus, WorkOrderType } from '@workorderpro/shared';

export interface WorkOrder {
    id: string;
    tenantId: string;
    assetId: string;
    title: string;
    description?: string;
    priority: WorkOrderPriority;
    status: WorkOrderStatus;
    rimeScore: number;
    work_order_number?: string;
    dueDate?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
    type: 'CORRECTIVE' | 'PREVENTIVE';
    pmScheduleId?: string;

    // Relation View
    // Relation View
    asset?: Asset;
    attachments?: any[]; // Using any for now to avoid circular deps or complex importing, or define interface inline
}

export interface Attachment {
    id: string;
    url: string;
    fileName: string;
    mimeType: string;
}

export interface CreateWorkOrderDTO {
    assetId: string;
    title: string;
    priority: WorkOrderPriority;
    description?: string;
}
