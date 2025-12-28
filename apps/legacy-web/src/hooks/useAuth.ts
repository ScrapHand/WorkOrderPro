import { useTenant } from '@/context/TenantContext';

export const useAuth = () => {
    const { user, refreshUser } = useTenant();

    const role = user?.role?.toUpperCase() || "VIEWER";

    const isAdmin = role === "ADMIN";
    const isManager = role === "ADMIN" || role === "MANAGER";

    // Legacy support mapping
    const isTechnician = role === "TECHNICIAN" || role === "ENGINEER" || role === "ADMIN" || role === "MANAGER";

    return {
        user,
        role,
        isAdmin,
        isManager,
        isTechnician,
        refreshUser
    };
};
