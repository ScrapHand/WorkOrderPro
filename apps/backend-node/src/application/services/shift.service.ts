
import { PrismaClient } from '@prisma/client';
import { logger } from '../../infrastructure/logging/logger';

export class ShiftService {
    constructor(private prisma: PrismaClient) { }

    /**
     * Create a new shift handover draft
     */
    async createHandover(tenantId: string, outgoingUserId: string, data: {
        shiftType: string;
        content: {
            safetyNotes: string;
            activeWOs: string[];
            operationalNotes: string;
        }
    }) {
        logger.info({ tenantId, outgoingUserId, shiftType: data.shiftType }, 'Creating shift handover draft');

        return this.prisma.shiftHandover.create({
            data: {
                tenantId,
                outgoingUserId,
                shiftType: data.shiftType,
                content: data.content,
                status: 'PENDING'
            }
        });
    }

    /**
     * Incoming technician signs/acknowledges a handover
     */
    async signHandover(id: string, tenantId: string, incomingUserId: string) {
        const handover = await this.prisma.shiftHandover.findFirst({
            where: { id, tenantId }
        });

        if (!handover) throw new Error('Shift handover not found');
        if (handover.status === 'SIGNED') throw new Error('Handover already signed');
        if (handover.outgoingUserId === incomingUserId) {
            throw new Error('Self-handover is not permitted. Transition must be signed by the incoming technician.');
        }

        logger.info({ id, tenantId, incomingUserId }, 'Shift handover signed');

        return this.prisma.shiftHandover.update({
            where: { id },
            data: {
                incomingUserId,
                status: 'SIGNED',
                signedAt: new Date()
            }
        });
    }

    /**
     * Fetch shift handovers for a tenant
     */
    async getHandovers(tenantId: string, limit = 20) {
        return this.prisma.shiftHandover.findMany({
            where: { tenantId },
            include: {
                outgoingUser: { select: { id: true, username: true, email: true } },
                incomingUser: { select: { id: true, username: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }

    /**
     * Get active work orders for a potential handover snapshot
     */
    async getActiveWorkOrdersSnapshot(tenantId: string) {
        return this.prisma.workOrder.findMany({
            where: {
                tenantId,
                status: { in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD'] },
                deletedAt: null
            },
            select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                asset: { select: { name: true } }
            },
            orderBy: { rimeScore: 'desc' }
        });
    }
}
