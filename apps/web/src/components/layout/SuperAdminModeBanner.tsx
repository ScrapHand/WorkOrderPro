"use client";

import { useUser } from "@/hooks/use-auth";
import { UserRole } from "@/lib/auth/types";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SuperAdminModeBanner() {
    const { data: user } = useUser();
    const params = useParams();
    const router = useRouter();
    const tenantSlug = params.tenantSlug as string;

    // Show only for Super Admins when they are NOT in the 'default' or 'system' context
    // and they are visiting a specific tenant's dashboard.
    if (!user || user.role !== UserRole.SUPER_ADMIN) return null;
    if (tenantSlug === 'default' || tenantSlug === 'system' || !tenantSlug) return null;

    return (
        <div className="bg-[#6366f1] text-white px-4 py-2.5 flex items-center justify-between shadow-xl backdrop-blur-md sticky top-0 z-[100] border-b border-indigo-400/30">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg shadow-inner">
                    <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex flex-col leading-tight">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-xs uppercase tracking-widest">Platform Orchestration Mode</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    </div>
                    <span className="text-sm font-medium opacity-90 truncate max-w-[150px] sm:max-w-none">
                        Active Drill-down: <span className="underline decoration-indigo-300 decoration-2 underline-offset-4 capitalize font-bold">{tenantSlug}</span>
                    </span>
                </div>
            </div>
            <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-indigo-300/30 gap-2 font-bold px-4 rounded-full transition-all hover:pr-6 active:scale-95 group"
                onClick={() => router.push('/super-admin')}
            >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Return to Nexus
            </Button>
        </div>
    );
}
