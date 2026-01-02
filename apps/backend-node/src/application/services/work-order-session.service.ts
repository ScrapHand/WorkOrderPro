import { PrismaClient } from '@prisma/client';
import { WorkOrderSession } from '../../domain/entities/work-order-session.entity';
import { IWorkOrderSessionRepository } from '../../domain/repositories/work-order-session.repository.interface';
import { v4 as uuidv4 } from 'uuid';

export class WorkOrderSessionService {
    constructor(
        private sessionRepo: IWorkOrderSessionRepository,
        private prisma: PrismaClient
    ) { }

    async startSession(tenantId: string, workOrderId: string, userId: string): Promise<WorkOrderSession> {
        // 1. Check if user already has an active session for this WO? 
        // (Optional: Prevent double clock-in. Let's enforce single session per user per WO)
        const active = await this.sessionRepo.findActiveByUser(tenantId, userId);
        const existing = active.find(s => s.workOrderId === workOrderId);
        if (existing) {
            return existing; // Already clocked in
        }

        // 2. Create Session
        const session = new WorkOrderSession(
            uuidv4(),
            tenantId,
            workOrderId,
            userId,
            new Date(),
            null,
            null
        );
        const saved = await this.sessionRepo.create(session);

        // 3. Update WO Status to IN_PROGRESS
        await this.prisma.workOrder.update({
            where: { id: workOrderId },
            data: { status: 'IN_PROGRESS' }
        });

        return saved;
    }

    async stopSession(tenantId: string, workOrderId: string, userId: string): Promise<WorkOrderSession | null> {
        const active = await this.sessionRepo.findActiveByUser(tenantId, userId);
        const target = active.find(s => s.workOrderId === workOrderId);

        if (!target) return null;

        return this.closeSession(target);
    }

    private async closeSession(session: WorkOrderSession): Promise<WorkOrderSession> {
        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - session.startTime.getTime()) / 1000 / 60); // Minutes

        const updated = new WorkOrderSession(
            session.id,
            session.tenantId,
            session.workOrderId,
            session.userId,
            session.startTime,
            endTime,
            duration
        );
        return this.sessionRepo.update(updated);
    }

    async pauseWorkOrder(tenantId: string, workOrderId: string): Promise<void> {
        // 1. Find ALL active sessions for this WO
        const activeSessions = await this.sessionRepo.findActiveByWorkOrder(tenantId, workOrderId);

        // 2. Close them all
        for (const session of activeSessions) {
            await this.closeSession(session);
        }

        // 3. Update Status
        await this.prisma.workOrder.update({
            where: { id: workOrderId },
            data: { status: 'ON_HOLD' }
        });
    }

    async completeWorkOrder(tenantId: string, workOrderId: string, notes: string): Promise<void> {
        // 1. Close all active sessions
        await this.pauseWorkOrder(tenantId, workOrderId);

        // 2. Update status and completion fields
        await this.prisma.workOrder.update({
            where: { id: workOrderId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                completionNotes: notes
            }
        });
    }

    async getSessions(tenantId: string, workOrderId: string): Promise<any[]> {
        return this.prisma.workOrderSession.findMany({
            where: { tenantId, workOrderId },
            include: { user: { select: { username: true, email: true } } },
            orderBy: { startTime: 'desc' }
        });
    }

    async getActiveWorkOrdersForUser(tenantId: string, userId: string): Promise<any[]> {
        // Direct Prisma Query for Rich Data (Session + WorkOrder)
        const sessions = await this.prisma.workOrderSession.findMany({
            where: {
                tenantId,
                userId,
                endTime: null
            },
            include: {
                workOrder: true
            },
            orderBy: { startTime: 'desc' }
        });

        // Return flattened structure or just sessions with included WO
        return sessions.map(s => ({
            ...s,
            workOrder: (s as any).workOrder
        }));
    }
}
