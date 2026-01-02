export interface IWorkOrderRepository {
    create(data: any): Promise<any>;
    findAll(tenantId: string): Promise<any[]>;
    findById(id: string, tenantId: string): Promise<any | null>;
}

import { PrismaClient } from '@prisma/client';

export class PostgresWorkOrderRepository implements IWorkOrderRepository {
    constructor(private prisma: PrismaClient) { }

    async create(data: any): Promise<any> {
        return this.prisma.workOrder.create({ data });
    }

    async findAll(tenantId: string): Promise<any[]> {
        return this.prisma.workOrder.findMany({
            where: { tenantId, deletedAt: null },
            orderBy: { rimeScore: 'desc' }, // Sorted by RIME Descending
            include: { asset: true }
        });
    }

    async findById(id: string, tenantId: string): Promise<any | null> {
        return this.prisma.workOrder.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: { asset: true }
        });
    }
}
