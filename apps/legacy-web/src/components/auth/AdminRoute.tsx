"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/context/TenantContext';

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAdmin, role, user } = useAuth();
    const { tenant, isLoading } = useTenant();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push(`/${tenant?.slug}/login`);
            } else if (!isAdmin) {
                console.warn(`Access Denied: User role ${role} is not ADMIN`);
                router.push(`/${tenant?.slug}/dashboard`);
            }
        }
    }, [isLoading, isAdmin, role, user, tenant, router]);

    if (isLoading || !user || !isAdmin) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Verifying Privileges...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
