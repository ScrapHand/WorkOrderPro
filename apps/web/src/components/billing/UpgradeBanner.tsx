"use client";

import React from "react";
import { Zap, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUser } from "@/hooks/use-auth";
import { UserRole } from "@/lib/auth/types";
import { useTheme } from "@/context/ThemeContext";

export function UpgradeBanner() {
    const { data: user } = useUser();
    const { config } = useTheme();
    const queryClient = useQueryClient();

    // Only show for Tenant Admins on the STARTER plan
    const isStarter = config?.plan === 'STARTER' || !config?.plan || config?.plan === 'free';
    const isTenantAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

    const upgradeMutation = useMutation({
        mutationFn: async (plan: string) => {
            return api.post(`/tenant/${user?.tenantId}/upgrade`, { plan });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-config'] });
            window.location.reload(); // Refresh to apply new limits
        }
    });

    if (!isStarter || !isTenantAdmin) return null;

    return (
        <div className="mx-2 mt-4 p-4 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg border border-blue-400/30">
            <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                    <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                    <h4 className="text-sm font-bold">Free Plan Limits</h4>
                    <p className="text-[10px] text-blue-100 opacity-90">Unlock advanced analytics & more users.</p>
                </div>
            </div>

            <Button
                size="sm"
                className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold transition-transform active:scale-95"
                onClick={() => upgradeMutation.mutate('PRO')}
                disabled={upgradeMutation.isPending}
            >
                {upgradeMutation.isPending ? "Upgrading..." : (
                    <span className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4" /> Upgrade to Pro
                    </span>
                )}
            </Button>
        </div>
    );
}
