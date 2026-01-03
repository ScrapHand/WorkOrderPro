"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type BrandingConfig = {
    primaryColor?: string;
    secondaryColor?: string;
    textColor?: string; // [NEW] Foreground/Text
    backgroundColor?: string; // [NEW] Background/Backdrop
    mutedColor?: string; // [NEW] Muted/Sidebar
    logoUrl?: string;
    font?: string;
    appName?: string;
    terminology?: {
        assets?: string; // e.g. "Machines"
        workOrders?: string; // e.g. "Jobs"
        technicians?: string; // e.g. "Engineers"
        inventory?: string; // [NEW] e.g. "Parts"
        reports?: string; // [NEW] e.g. "Analytics"
        customers?: string; // [NEW] e.g. "Clients"
    };
};

type TenantConfig = {
    slug: string;
    name: string;
    branding: BrandingConfig;
    rbac: any;
    secrets?: Record<string, string>;
    notifications?: {
        enabled: boolean;
        soundUrl: string;
        volume: number;
    };
};

type ThemeContextType = {
    config: TenantConfig | null;
    refreshConfig: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: config, refetch } = useQuery<TenantConfig>({
        queryKey: ["tenantConfig"],
        queryFn: async () => {
            const res = await api.get("/tenant/config");
            return res.data;
        },
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (config?.branding) {
            const root = document.documentElement;
            const b = config.branding;

            if (b.primaryColor) {
                root.style.setProperty("--primary", b.primaryColor);
                // Simple darkening for hover - in a real app use a color lib
                root.style.setProperty("--primary-foreground", "#ffffff");
            }
            if (b.secondaryColor) {
                root.style.setProperty("--secondary", b.secondaryColor);
                root.style.setProperty("--secondary-foreground", "#ffffff");
            }
            if (b.textColor) {
                root.style.setProperty("--foreground", b.textColor);
            }
            if (b.backgroundColor) {
                root.style.setProperty("--background", b.backgroundColor);
            }
            if (b.mutedColor) {
                root.style.setProperty("--muted", b.mutedColor);
            }
            if (b.font) {
                root.style.setProperty("--font-sans", b.font);
            }
        }
    }, [config]);

    return (
        <ThemeContext.Provider value={{ config: config || null, refreshConfig: refetch }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
