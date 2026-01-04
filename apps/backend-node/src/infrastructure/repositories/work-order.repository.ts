export interface IWorkOrderRepository {
    create(data: any): Promise<any>;
    findAll(tenantId: string, status?: string): Promise<any[]>;
    findById(id: string, tenantId: string): Promise<any | null>;
    delete(id: string, tenantId: string): Promise<void>;
}

import { PrismaClient } from '@prisma/client';

export class PostgresWorkOrderRepository implements IWorkOrderRepository {
    constructor(private prisma: PrismaClient) { }

    async create(data: any): Promise<any> {
        return this.prisma.workOrder.create({ data });
    }

    async findAll(tenantId: string, filters: any = {}): Promise<any[]> {
        const where: any = { tenantId, deletedAt: null };

        // Status Filter
        if (filters.status) {
            where.status = filters.status;
        }

        // Asset Filter (Exact Match)
        if (filters.assetId) {
            where.assetId = filters.assetId;
        }

        // Priority Filter
        if (filters.priority) {
            where.priority = filters.priority;
        }

        // Date Range Filter (Created At)
        if (filters.from || filters.to) {
            where.createdAt = {};
            if (filters.from) where.createdAt.gte = new Date(filters.from);
            if (filters.to) where.createdAt.lte = new Date(filters.to);
        }

        // Group Filter (Hierarchy Path)
        if (filters.rootAssetId) {
            // Fetch root asset to get its path
            const rootAsset = await this.prisma.asset.findUnique({
                where: { id: filters.rootAssetId }
            });

            if (rootAsset?.hierarchyPath) {
                where.asset = {
                    hierarchyPath: {
                        startsWith: rootAsset.hierarchyPath
                    }
                };
            }
        }

        return this.prisma.workOrder.findMany({
            where,
            orderBy: { createdAt: 'desc' }, // Sorted by Date Descending (Newest First)
            include: { asset: true }
        });
    }

    async findById(id: string, tenantId: string): Promise<any | null> {
        return this.prisma.workOrder.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: { asset: true, attachments: true }
        });
    }

    async delete(id: string, tenantId: string): Promise<void> {
        // Soft Delete
        await this.prisma.workOrder.updateMany({
            where: { id, tenantId },
            data: { deletedAt: new Date() }
        });
    }
}
