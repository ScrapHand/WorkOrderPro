export enum UserRole {
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
    full_name: string;
    role: UserRole;
    is_active: boolean;
    tenantSlug?: string;
}
