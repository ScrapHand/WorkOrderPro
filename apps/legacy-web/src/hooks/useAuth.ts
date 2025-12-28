import { useTenant } from '@/context/TenantContext';
import { UserRole } from '@/types';

export const useAuth = () => {
    const { user, refreshUser, isLoading } = useTenant();

    const role = (user?.role as UserRole) || UserRole.VIEWER;

    const isAdmin = role === UserRole.ADMIN;
    const isManager = role === UserRole.ADMIN || role === UserRole.MANAGER;

    // Legacy/Technician logic
    const isTechnician = [UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.MANAGER].includes(role);

    return {
        user,
        role,
        isAdmin,
        isManager,
        isTechnician,
        isLoading,
        refreshUser
    };
};
