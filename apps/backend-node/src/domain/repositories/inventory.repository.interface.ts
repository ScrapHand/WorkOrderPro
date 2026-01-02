import { InventoryItem } from '../entities/inventory.entity';

export interface IInventoryRepository {
    create(item: InventoryItem): Promise<void>;
    update(item: InventoryItem): Promise<void>;
    delete(id: string, tenantId: string): Promise<void>;
    findById(id: string, tenantId: string): Promise<InventoryItem | null>;
    findAll(tenantId: string): Promise<InventoryItem[]>;
}
