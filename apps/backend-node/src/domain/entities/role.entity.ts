export class Role {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly name: string,
        public readonly permissions: string[], // JSON array in DB, string[] here
        public readonly description?: string | null,
        public readonly isSystem: boolean = false,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date
    ) { }
}
