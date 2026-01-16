export enum AssetStatus {
    OPERATIONAL = 'OPERATIONAL',
    DOWN = 'DOWN',
    MAINTENANCE = 'MAINTENANCE'
}

export enum WorkOrderPriority {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW'
}

export enum WorkOrderStatus {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    ON_HOLD = 'ON_HOLD',
    DONE = 'DONE',
    CANCELLED = 'CANCELLED'
}

export enum WorkOrderType {
    REACTIVE = 'REACTIVE',
    PREVENTIVE = 'PREVENTIVE'
}

export const TERMINOLOGY_DEFAULTS = {
    assets: 'Assets',
    workOrders: 'Work Orders',
    inventory: 'Inventory',
    reports: 'Reports'
};

export const PRIORITY_SCORES = {
    [WorkOrderPriority.CRITICAL]: 10,
    [WorkOrderPriority.HIGH]: 7,
    [WorkOrderPriority.MEDIUM]: 4,
    [WorkOrderPriority.LOW]: 1
};
