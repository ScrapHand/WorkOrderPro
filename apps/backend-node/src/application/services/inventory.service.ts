import { InventoryItem } from '../domain/entities/inventory.entity';
import { IInventoryRepository } from '../domain/repositories/inventory.repository.interface';
import { v4 as uuidv4 } from 'uuid';

export class InventoryService {
    constructor(private inventoryRepo: IInventoryRepository) { }

    async createItem(
        tenantId: string,
        data: {
            name: string;
            quantity: number;
            threshold: number;
            locationId?: string;
            imageUrl?: string;
            supplierInfo?: any;
        }
    ): Promise<InventoryItem> {
        const newItem = new InventoryItem(
            uuidv4(),
            tenantId,
            data.name,
            data.quantity,
            data.threshold,
            data.locationId,
            data.imageUrl,
            data.supplierInfo
        );

        await this.inventoryRepo.create(newItem);
        return newItem;
    }

    async updateItem(
        id: string,
        tenantId: string,
        data: Partial<InventoryItem>
    ): Promise<InventoryItem> {
        const existing = await this.inventoryRepo.findById(id, tenantId);
        if (!existing) throw new Error('Item not found');

        Object.assign(existing, data);
        await this.inventoryRepo.update(existing);
        return existing;
    }

    async listItems(tenantId: string): Promise<InventoryItem[]> {
        return this.inventoryRepo.findAll(tenantId);
    }

    async deleteItem(id: string, tenantId: string): Promise<void> {
        return this.inventoryRepo.delete(id, tenantId);
    }
}
