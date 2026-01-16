import { PrismaClient } from '@prisma/client';
import { IWorkOrderRepository } from '../../infrastructure/repositories/work-order.repository';
import { RimeService } from './rime.service';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../infrastructure/logging/logger';

export class WorkOrderService {
    constructor(
        private woRepo: IWorkOrderRepository,
        private rimeService: RimeService,
        private prisma: PrismaClient
    ) { }

    async createWorkOrder(tenantId: string, assetId: string, title: string, priority: string, description?: string, assignedUserId?: string) {
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
            rimeScore,
            assignedUserId
        };

        const saved = await this.woRepo.create(workOrder);

        // Sync Asset Status
        await this.syncAssetStatus(tenantId, assetId);

        return saved;
    }

    async getWorkOrders(tenantId: string, filters: any = {}) {
        return this.woRepo.findAll(tenantId, filters);
    }
    async getWorkOrderById(id: string, tenantId: string) {
        return this.woRepo.findById(id, tenantId);
    }

    async updateWorkOrder(id: string, tenantId: string, data: any) {
        const updated = await this.woRepo.update(id, tenantId, data);

        // If status or priority changed, or assetId changed, sync status
        // Since we don't know exactly what changed easily with the generic 'data', we'll just check if we have the assetId
        const wo = await this.woRepo.findById(id, tenantId);
        if (wo?.assetId) {
            await this.syncAssetStatus(tenantId, wo.assetId);
        }

        return updated;
    }

    async deleteWorkOrder(id: string, tenantId: string) {
        const wo = await this.woRepo.findById(id, tenantId);
        const assetId = wo?.assetId;

        await this.woRepo.delete(id, tenantId);

        if (assetId) {
            await this.syncAssetStatus(tenantId, assetId);
        }
    }

    /**
     * Re-calculate and sync asset status based on active work orders
     */
    private async syncAssetStatus(tenantId: string, assetId: string) {
        try {
            if (!assetId) return;

            // 1. Get all active WOs for this asset
            const activeWOs = await this.prisma.workOrder.findMany({
                where: {
                    tenantId,
                    assetId,
                    status: {
                        in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD']
                    },
                    deletedAt: null
                }
            });

            let newStatus: 'OPERATIONAL' | 'DOWN' | 'DEGRADED' = 'OPERATIONAL';

            if (activeWOs.some(wo => wo.priority === 'CRITICAL')) {
                newStatus = 'DOWN';
            } else if (activeWOs.length > 0) {
                newStatus = 'DEGRADED';
            }

            // 2. Update Asset
            await this.prisma.asset.update({
                where: { id: assetId },
                data: { status: newStatus }
            });

            logger.debug({ assetId, tenantId, newStatus }, 'Synced asset status based on active work orders');
        } catch (error) {
            logger.error({ error, assetId, tenantId }, 'Failed to sync asset status');
        }
    }
}
