export class WorkOrderSession {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly workOrderId: string,
        public readonly userId: string,
        public readonly startTime: Date,
        public readonly endTime?: Date | null,
        public readonly duration?: number | null // minutes
    ) { }

    get isActive(): boolean {
        return !this.endTime;
    }
}
