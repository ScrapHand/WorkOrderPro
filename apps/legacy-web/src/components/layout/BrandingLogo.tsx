"use client";
import React from 'react';
import { useTenant } from '@/context/TenantContext';
import { resolveBackendUrl } from '@/lib/api';
import { ShieldCheck } from 'lucide-react';

interface BrandingLogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
}

export function BrandingLogo({ className = "", size = 'md', showText = true }: BrandingLogoProps) {
    const { tenant, isLoading } = useTenant();

    const logoUrl = tenant?.theme_json?.branding?.logoUrl;
    const tenantName = tenant?.theme_json?.naming?.tenantName || tenant?.name || "WorkOrderPro";
    const customTitle = tenant?.theme_json?.naming?.systemTitle || "Industrial CMMS";

    const dimensions = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12'
    };

    const textSizes = {
        sm: 'text-xs',
        md: 'text-lg',
        lg: 'text-xl'
    };

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {logoUrl ? (
                <div className={`${dimensions[size]} rounded-lg overflow-hidden border border-white/10 flex items-center justify-center bg-white/5`}>
                    <img src={resolveBackendUrl(logoUrl) || ""} alt="Logo" className="w-full h-full object-contain" />
                </div>
            ) : (
                <div className={`${dimensions[size]} bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20`}>
                    <ShieldCheck className="text-primary w-6 h-6" />
                </div>
            )}

            {showText && (
                <div className="flex flex-col">
                    {isLoading ? (
                        <div className="animate-pulse h-6 w-32 bg-slate-800 rounded"></div>
                    ) : (
                        <>
                            <span className={`font-bold tracking-tight text-white leading-none ${textSizes[size]}`}>
                                {tenantName}
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-muted font-semibold mt-1">
                                {customTitle}
                            </span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
