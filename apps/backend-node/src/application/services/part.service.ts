
import { PrismaClient, Part } from '@prisma/client';
import { logger } from '../../infrastructure/logging/logger';

export class PartService {
    constructor(private prisma: PrismaClient) { }

    async create(tenantId: string, data: {
        name: string;
        sku?: string;
        description?: string;
        quantity: number;
        cost: number;
        unit?: string;
        category?: string;
        minQuantity?: number;
        binLocation?: string
    }) {
        return this.prisma.part.create({
            data: {
                tenantId,
                name: data.name,
                sku: data.sku,
                description: data.description,
                quantity: data.quantity,
                cost: data.cost,
                unit: data.unit || 'pcs',
                category: data.category,
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

            // 3. Automated Inventory Alerts [PHASE 4]
            if (part.quantity <= part.minQuantity) {
                const type = part.quantity <= (part.minQuantity / 2) ? 'CRITICAL' : 'WARNING';

                // Create Alert if not already active
                const existing = await tx.inventoryAlert.findFirst({
                    where: { tenantId, partId, status: 'ACTIVE' }
                });

                if (!existing) {
                    await tx.inventoryAlert.create({
                        data: {
                            tenantId,
                            partId,
                            type,
                            message: `${part.name} is low on stock (${part.quantity} remaining). Minimum is ${part.minQuantity}.`,
                            status: 'ACTIVE'
                        }
                    });
                    logger.warn({ partId, tenantId, quantity: part.quantity }, 'Inventory Alert Created');
                } else if (existing.type !== type) {
                    // Update severity if it escalated
                    await tx.inventoryAlert.update({
                        where: { id: existing.id },
                        data: { type }
                    });
                }
            } else {
                // Resolve Alert if stock is now healthy
                await tx.inventoryAlert.updateMany({
                    where: { tenantId, partId, status: 'ACTIVE' },
                    data: {
                        status: 'RESOLVED',
                        resolvedAt: new Date()
                    }
                });
            }

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
