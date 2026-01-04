"use client";

import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/lib/auth/types";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: user, isLoading } = useAuth();
    const router = useRouter();

    const params = useParams();
    const slug = (params?.tenantSlug as string) || 'default';

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/auth/login");
            } else {
                const isMaster = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.GLOBAL_ADMIN;
                const isGod = user.email === 'scraphand@admin.com';
                const isAdmin = user.role === UserRole.ADMIN;

                if (!isAdmin && !isMaster && !isGod) {
                    router.push(`/${slug}/dashboard`);
                }
            }
        }
    }, [user, isLoading, router, slug]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Allow render if authorized logic matches (duplicate check for render safety)
    const isMaster = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.GLOBAL_ADMIN;
    const isGod = user?.email === 'scraphand@admin.com';
    const isAdmin = user?.role === UserRole.ADMIN;

    if (!user || (!isAdmin && !isMaster && !isGod)) {
        return null;
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6 tracking-tight">Platform Administration</h1>
            {children}
        </div>
    );
}
