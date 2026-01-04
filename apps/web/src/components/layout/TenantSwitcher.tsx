"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUser } from "@/hooks/use-auth";
import { UserRole } from "@/lib/auth/types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface Tenant {
    id: string;
    slug: string;
    name: string;
}

export function TenantSwitcher() {
    const router = useRouter();
    const params = useParams();
    const currentSlug = (params?.tenantSlug as string) || "default";
    const { data: user } = useUser();

    // Only SUPER_ADMIN can switch
    const isMaster = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.GLOBAL_ADMIN;

    const { data: tenants, isLoading } = useQuery<Tenant[]>({
        queryKey: ["tenants"],
        queryFn: async () => {
            const res = await api.get("/tenant"); // [FIX] Backend route is singular '/tenant'
            return res.data;
        },
        enabled: isMaster // Only fetch if master
    });

    if (!isMaster) return null;

    const handleSwitch = (slug: string) => {
        // Full reload to ensure clean state context
        window.location.href = `/${slug}/dashboard`;
    };

    return (
        <div className="px-4 py-2 border-b bg-muted/20">
            <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Tenant Context
                </span>
            </div>
            <Select value={currentSlug} onValueChange={handleSwitch} disabled={isLoading}>
                <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Select Tenant" />
                </SelectTrigger>
                <SelectContent>
                    {tenants?.map((t) => (
                        <SelectItem key={t.id} value={t.slug} className="text-xs">
                            {t.name} <span className="text-muted-foreground opacity-50 ml-1">({t.slug})</span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
