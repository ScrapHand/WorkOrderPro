'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { user, isLoading } = useAuth();

    if (isLoading) return null; // Or a spinner/skeleton could go here

    // Note: user.role coming from API is strictly typed now.
    // We double check existence and inclusion.
    if (!user || !allowedRoles.includes(user.role as UserRole)) {
        return null; // Renders nothing if they don't have permission
    }

    return <>{children}</>;
}
