import { WorkOrderSession } from '../entities/work-order-session.entity';

export interface IWorkOrderSessionRepository {
    create(session: WorkOrderSession): Promise<WorkOrderSession>;
    update(session: WorkOrderSession): Promise<WorkOrderSession>;
    findActiveByWorkOrder(tenantId: string, workOrderId: string): Promise<WorkOrderSession[]>;
    findActiveByUser(tenantId: string, userId: string): Promise<WorkOrderSession[]>;
    findByWorkOrder(tenantId: string, workOrderId: string): Promise<WorkOrderSession[]>;
}
