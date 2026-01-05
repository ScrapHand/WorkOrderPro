"use client";

import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/lib/auth/types";


interface RoleGuardProps {
    allowedRoles?: UserRole[];
    requiredPermission?: string;
    children: ReactNode;
    fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, requiredPermission, children, fallback = null }: RoleGuardProps) {
    const { data: user, isLoading } = useAuth();

    if (isLoading) {
        // Minimalist skeleton/loading state to prevent jumping
        return <div className="animate-pulse h-10 w-full bg-muted/20 rounded" />;
    }

    if (!user) {
        return <>{fallback}</>;
    }

    // [RBAC] 1. Permission Check
    if (requiredPermission) {
        // Super/Global Admin Bypass
        if (['SUPER_ADMIN', 'GLOBAL_ADMIN'].includes(user.role)) return <>{children}</>;

        // Temporary Legacy Bypass until all roles have permissions migrated
        if (user.role === 'ADMIN') return <>{children}</>;

        // Check Permissions Array
        if (user.permissions?.includes('*')) return <>{children}</>;
        if (user.permissions?.includes(requiredPermission)) return <>{children}</>;

        return <>{fallback}</>;
    }

    // 2. Role Check (Legacy)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
