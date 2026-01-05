export enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    GLOBAL_ADMIN = "GLOBAL_ADMIN",
    SYSTEM_ADMIN = "SYSTEM_ADMIN",
    ADMIN = "ADMIN",
    MANAGER = "MANAGER",
    TECHNICIAN = "TECHNICIAN",
    VIEWER = "VIEWER"
}

export interface User {
    id: string;
    email: string;
    username?: string;
    full_name?: string; // Often synthesized
    avatarUrl?: string;
    role: UserRole;
    tenantId: string; ve: boolean;
    tenantSlug?: string;
    permissions?: string[]; // [RBAC] Granular permissions
}
