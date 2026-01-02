import { PrismaClient } from '@prisma/client';
import { IInventoryRepository } from '../../domain/repositories/inventory.repository.interface';
import { InventoryItem } from '../../domain/entities/inventory.entity';

const mapToDomain = (row: any): InventoryItem => {
    return new InventoryItem(
        row.id,
        row.tenantId || row.tenant_id,
        row.name,
        row.quantity,
        row.threshold,
        row.locationId || row.location_id,
        row.imageUrl || row.image_url,
        row.supplierInfo || row.supplier_info,
        row.createdAt,
        row.updatedAt
    );
};

export class PostgresInventoryRepository implements IInventoryRepository {
    constructor(private prisma: PrismaClient) { }

    async create(item: InventoryItem): Promise<void> {
        await this.prisma.inventoryItem.create({
            data: {
                id: item.id,
                tenantId: item.tenantId,
                name: item.name,
                quantity: item.quantity,
                threshold: item.threshold,
                locationId: item.locationId,
                imageUrl: item.imageUrl,
                supplierInfo: item.supplierInfo
            }
        });
    }

    async update(item: InventoryItem): Promise<void> {
        await this.prisma.inventoryItem.update({
            where: { id: item.id },
            data: {
                name: item.name,
                quantity: item.quantity,
                threshold: item.threshold,
                locationId: item.locationId,
                imageUrl: item.imageUrl,
                supplierInfo: item.supplierInfo
            }
        });
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await this.prisma.inventoryItem.deleteMany({
            where: { id, tenantId }
        });
    }

    async findById(id: string, tenantId: string): Promise<InventoryItem | null> {
        const result = await this.prisma.inventoryItem.findFirst({
            where: { id, tenantId }
        });
        return result ? mapToDomain(result) : null;
    }

    async findAll(tenantId: string): Promise<InventoryItem[]> {
        const results = await this.prisma.inventoryItem.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' }
        });
        return results.map(mapToDomain);
    }
}
