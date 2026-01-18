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

        // [PHASE 7] Calculate SLA Deadline
        const slaDeadline = this.calculateSlaDeadline(priority);

        const workOrder = {
            id: uuidv4(),
            tenantId,
            assetId,
            title,
            description,
            priority,
            status: 'OPEN',
            rimeScore,
            assignedUserId,
            slaDeadline,
            slaStatus: 'IN_TARGET'
        };

        const saved = await this.woRepo.create(workOrder);

        // Sync Asset Status
        await this.syncAssetStatus(tenantId, assetId);

        return saved;
    }

    private calculateSlaDeadline(priority: string): Date {
        const now = new Date();
        const upperPriority = priority.toUpperCase();

        let hours = 48; // Default
        if (upperPriority === 'CRITICAL') hours = 2;
        else if (upperPriority === 'HIGH') hours = 4;
        else if (upperPriority === 'MEDIUM') hours = 12;
        else if (upperPriority === 'LOW') hours = 24;

        now.setHours(now.getHours() + hours);
        return now;
    }

    async getWorkOrders(tenantId: string, filters: any = {}) {
        return this.woRepo.findAll(tenantId, filters);
    }
    async getWorkOrderById(id: string, tenantId: string) {
        return this.woRepo.findById(id, tenantId);
    }

    async updateWorkOrder(id: string, tenantId: string, data: any) {
        // [SAFETY GUARD] Block IN_PROGRESS if LOTO required but not verified
        if (data.status === 'IN_PROGRESS') {
            const wo = await this.woRepo.findById(id, tenantId);
            const asset = await this.prisma.asset.findUnique({
                where: { id: wo.assetId },
                select: { lotoConfig: true }
            });

            const hasLoto = asset?.lotoConfig && Object.keys(asset.lotoConfig as any).length > 0;
            if (hasLoto && !wo.lotoVerified) {
                logger.warn({ id, tenantId }, 'Attempted to start work order without LOTO verification');
                throw new Error('Lockout/Tagout (LOTO) verification is required before starting this work order.');
            }
        }

        const updated = await this.woRepo.update(id, tenantId, data);

        // If status or priority changed, or assetId changed, sync status
        const wo = await this.woRepo.findById(id, tenantId);
        if (wo?.assetId) {
            await this.syncAssetStatus(tenantId, wo.assetId);
        }

        return updated;
    }

    async verifySafety(id: string, tenantId: string) {
        const wo = await this.woRepo.findById(id, tenantId);
        if (!wo) throw new Error('Work order not found');

        logger.info({ id, tenantId }, 'LOTO Safety verified for work order');

        return this.woRepo.update(id, tenantId, {
            lotoVerified: true,
            lotoVerifiedAt: new Date()
        });
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
