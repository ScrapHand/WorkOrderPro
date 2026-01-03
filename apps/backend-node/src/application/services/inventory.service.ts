import { InventoryItem } from '../../domain/entities/inventory.entity';
import { IInventoryRepository } from '../../domain/repositories/inventory.repository.interface';
import { v4 as uuidv4 } from 'uuid';

export class PartService {
    constructor(private partRepo: IPartRepository) { }

    async create(tenantId: string, data: any): Promise<Part> {
        return this.partRepo.create(data);
    }
    // TODO: Full implementation in next iteration
}
