import { IWorkOrderRepository } from '../../infrastructure/repositories/work-order.repository';
import { RimeService } from './rime.service';
import { v4 as uuidv4 } from 'uuid';

export class WorkOrderService {
    constructor(
        private woRepo: IWorkOrderRepository,
        private rimeService: RimeService
    ) { }

    async createWorkOrder(tenantId: string, assetId: string, title: string, priority: string, description?: string) {
        // [CORE LOGIC] RIME Calculation
        const rimeScore = await this.rimeService.calculateScore(assetId, tenantId, priority);

        const workOrder = {
            id: uuidv4(),
            tenantId,
            assetId,
            title,
            description,
            priority,
            status: 'OPEN',
            rimeScore
        };

        return this.woRepo.create(workOrder);
    }

    async getWorkOrders(tenantId: string, filters: any = {}) {
        return this.woRepo.findAll(tenantId, filters);
    }
    async getWorkOrderById(id: string, tenantId: string) {
        return this.woRepo.findById(id, tenantId);
    }

    async deleteWorkOrder(id: string, tenantId: string) {
        return this.woRepo.delete(id, tenantId);
    }
}
