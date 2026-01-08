
import { PrismaClient, Part } from '@prisma/client';

export class PartService {
    constructor(private prisma: PrismaClient) { }

    async create(tenantId: string, data: { name: string; sku?: string; quantity: number; cost: number; minQuantity?: number; binLocation?: string }) {
        return this.prisma.part.create({
            data: {
                tenantId,
                name: data.name,
                sku: data.sku,
                quantity: data.quantity,
                cost: data.cost,
                minQuantity: data.minQuantity || 5,
                binLocation: data.binLocation
            }
        });
    }

    async getAll(tenantId: string) {
        return this.prisma.part.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' }
        });
    }

    async getById(id: string, tenantId: string) {
        return this.prisma.part.findFirst({
            where: { id, tenantId }
        });
    }

    async update(id: string, tenantId: string, data: Partial<Part>) {
        return this.prisma.part.update({
            where: { id, tenantId },
            data
        });
    }

    async delete(id: string, tenantId: string) {
        return this.prisma.part.delete({
            where: { id, tenantId }
        });
    }

    /**
     * Adjust stock level and record transaction
     */
    async adjustStock(tenantId: string, partId: string, change: number, type: 'IN' | 'OUT' | 'AUDIT', reason?: string, performedBy?: string) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Update Part Quantity
            const part = await tx.part.update({
                where: { id: partId, tenantId },
                data: {
                    quantity: {
                        increment: change
                    }
                }
            });

            // 2. Record Transaction
            await tx.inventoryTransaction.create({
                data: {
                    tenantId,
                    partId,
                    changeQuantity: change,
                    type,
                    reason,
                    performedBy
                }
            });

            return part;
        });
    }

    /**
     * Get recent transactions for a tenant
     */
    async getTransactions(tenantId: string, limit = 50) {
        return this.prisma.inventoryTransaction.findMany({
            where: { tenantId },
            include: { part: { select: { name: true, sku: true } } },
            orderBy: { performedAt: 'desc' },
            take: limit
        });
    }
}
