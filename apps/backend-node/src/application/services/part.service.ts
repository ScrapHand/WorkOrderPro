
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
            where: { id },
            data
        });
    }
}
