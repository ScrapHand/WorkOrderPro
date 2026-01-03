export interface Permission {
    key: string;
    description: string;
    group: 'work_order' | 'asset' | 'inventory' | 'user' | 'tenant' | 'report';
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: string[]; // List of permission keys
    isSystem: boolean;
    createdAt: string;
    updatedAt: string;
}

export const AVAILABLE_PERMISSIONS: Permission[] = [
    // Work Orders
    { key: 'work_order:read', description: 'View work orders', group: 'work_order' },
    { key: 'work_order:write', description: 'Create and edit work orders', group: 'work_order' },
    { key: 'work_order:delete', description: 'Delete work orders', group: 'work_order' },
    { key: 'work_order:archive', description: 'Access archived jobs', group: 'work_order' },

    // Assets
    { key: 'asset:read', description: 'View assets', group: 'asset' },
    { key: 'asset:write', description: 'Create and edit assets', group: 'asset' },
    { key: 'asset:delete', description: 'Delete assets', group: 'asset' },
    { key: 'asset:specs', description: 'Manage asset specifications', group: 'asset' },
    { key: 'asset:tree', description: 'Manage asset hierarchy', group: 'asset' },

    // Inventory
    { key: 'inventory:read', description: 'View inventory', group: 'inventory' },
    { key: 'inventory:write', description: 'Create and edit inventory', group: 'inventory' },
    { key: 'inventory:delete', description: 'Delete inventory', group: 'inventory' },

    // Users
    { key: 'user:read', description: 'View users', group: 'user' },
    { key: 'user:write', description: 'Create and edit users', group: 'user' },
    { key: 'user:delete', description: 'Delete users', group: 'user' },

    // Tenant / Company
    { key: 'tenant:manage', description: 'Manage company branding & settings', group: 'tenant' },

    // Reports
    { key: 'report:read', description: 'View reports', group: 'report' },
];
