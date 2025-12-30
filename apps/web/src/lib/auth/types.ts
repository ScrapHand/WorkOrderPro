export enum UserRole {
    ADMIN = "admin",
    MANAGER = "manager",
    TECHNICIAN = "technician",
    VIEWER = "viewer"
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
}
