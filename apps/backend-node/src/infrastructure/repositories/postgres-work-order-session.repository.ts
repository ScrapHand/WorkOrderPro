import { PrismaClient } from '@prisma/client';
import { WorkOrderSession } from '../../domain/entities/work-order-session.entity';
import { IWorkOrderSessionRepository } from '../../domain/repositories/work-order-session.repository.interface';

export class PostgresWorkOrderSessionRepository implements IWorkOrderSessionRepository {
    constructor(private prisma: PrismaClient) { }

    async create(session: WorkOrderSession): Promise<WorkOrderSession> {
        const created = await this.prisma.workOrderSession.create({
            data: {
                id: session.id,
                tenantId: session.tenantId,
                workOrderId: session.workOrderId,
                userId: session.userId,
                startTime: session.startTime,
                endTime: session.endTime,
                duration: session.duration
            }
        });
        return this.mapToEntity(created);
    }

    async update(session: WorkOrderSession): Promise<WorkOrderSession> {
        const updated = await this.prisma.workOrderSession.update({
            where: { id: session.id },
            data: {
                endTime: session.endTime,
                duration: session.duration
            }
        });
        return this.mapToEntity(updated);
    }

    async findActiveByWorkOrder(tenantId: string, workOrderId: string): Promise<WorkOrderSession[]> {
        const sessions = await this.prisma.workOrderSession.findMany({
            where: {
                tenantId,
                workOrderId,
                endTime: null
            }
        });
        return sessions.map(s => this.mapToEntity(s));
    }

    async findActiveByUser(tenantId: string, userId: string): Promise<WorkOrderSession[]> {
        const sessions = await this.prisma.workOrderSession.findMany({
            where: {
                tenantId,
                userId,
                endTime: null
            }
        });
        return sessions.map(s => this.mapToEntity(s));
    }

    async findByWorkOrder(tenantId: string, workOrderId: string): Promise<WorkOrderSession[]> {
        const sessions = await this.prisma.workOrderSession.findMany({
            where: { tenantId, workOrderId },
            orderBy: { startTime: 'desc' },
            include: { user: true } // Fetch user details for display
        });
        // We'll map to entity, but note that Entity doesn't have User info embedded. 
        // For simple logic, we mapped entity. For display, service might need raw prisma types or extended entity.
        // Let's stick to strict entity here and handle 'include' in a specific query if needed, 
        // OR extend entity. For now, strict entity.
        return sessions.map(s => this.mapToEntity(s));
    }

    private mapToEntity(prismaObj: any): WorkOrderSession {
        return new WorkOrderSession(
            prismaObj.id,
            prismaObj.tenantId,
            prismaObj.workOrderId,
            prismaObj.userId,
            prismaObj.startTime,
            prismaObj.endTime,
            prismaObj.duration
        );
    }
}
