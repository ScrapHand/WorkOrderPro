export enum UserRole {
    ADMIN = 'admin',
    MANAGER = 'manager',
    TEAM_LEADER = 'team_leader',
    TECHNICIAN = 'technician',
    ENGINEER = 'engineer',
    VIEWER = 'viewer',
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    tenant_id: string;
}

export interface WorkOrder {
    id: string;
    work_order_number?: string;
    title: string;
    description?: string;
    status: 'new' | 'in_progress' | 'on_hold' | 'waiting_parts' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    created_at: string;
    assigned_to?: User;
    asset?: any;
}
