export class Asset {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public name: string,
        public status: 'OPERATIONAL' | 'DOWN' | 'MAINTENANCE',
        public criticality: 'A' | 'B' | 'C',
        public hierarchyPath: string,
        public parentId?: string | null,
        public description?: string | null,
        public imageUrl?: string | null,
        public lotoConfig?: any | null,
        public documents?: any | null, // [FIX] Added documents field
        public createdAt?: Date,
        public updatedAt?: Date,
        public deletedAt?: Date | null,
        // Optional children for tree structure
        public children?: Asset[]
    ) { }

    // Domain Logic: Check if operational
    isOperational(): boolean {
        return this.status === 'OPERATIONAL';
    }

    // Domain Logic: Mark for decommissioning
    decommission(): void {
        this.deletedAt = new Date();
    }
}
