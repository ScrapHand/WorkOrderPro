export class Part {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly name: string,
        public readonly sku: string | null,
        public readonly description: string | null,
        public readonly cost: number,
        public readonly quantity: number,
        public readonly minQuantity: number,
        public readonly binLocation: string | null,
        public readonly imageUrl: string | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) { }
}
constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public name: string,
    public quantity: number = 0,
    public threshold: number = 5,
    public locationId ?: string | null,
    public imageUrl ?: string | null,
    public supplierInfo ?: any | null,
    public createdAt ?: Date,
    public updatedAt ?: Date
) { }

isLowStock(): boolean {
    return this.quantity <= this.threshold;
}
}
