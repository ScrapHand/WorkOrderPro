"use client";

import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/lib/auth/types";


interface RoleGuardProps {
    allowedRoles: UserRole[];
    children: ReactNode;
    fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
    const { data: user, isLoading } = useAuth();

    if (isLoading) {
        // Minimalist skeleton/loading state to prevent jumping
        return <div className="animate-pulse h-10 w-full bg-muted/20 rounded" />;
    }

    if (!user) {
        return <>{fallback}</>;
    }

    if (!allowedRoles.includes(user.role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
