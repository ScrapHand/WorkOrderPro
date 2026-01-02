export class InventoryItem {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public name: string,
        public quantity: number = 0,
        public threshold: number = 5,
        public locationId?: string | null,
        public imageUrl?: string | null,
        public supplierInfo?: any | null,
        public createdAt?: Date,
        public updatedAt?: Date
    ) { }

    isLowStock(): boolean {
        return this.quantity <= this.threshold;
    }
}
