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

// Helper to get luminance from hex
function getLuminance(hex: string) {
    const c = hex.substring(1);      // strip #
    const rgb = parseInt(c, 16);   // convert rrggbb to decimal
    const r = (rgb >> 16) & 0xff;  // extract red
    const g = (rgb >> 8) & 0xff;   // extract green
    const b = (rgb >> 0) & 0xff;   // extract blue

    // sRGB luminance formula
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

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

            // 1. Auto-detect Dark Mode based on Background Color
            if (b.backgroundColor) {
                const lum = getLuminance(b.backgroundColor);
                // If luminance is low (< 128), it's dark
                if (lum < 100) {
                    root.classList.add("dark");
                } else {
                    root.classList.remove("dark");
                }
            }

            // 2. Apply CSS Variables
            if (b.primaryColor) {
                root.style.setProperty("--primary", b.primaryColor);
                // Ensure text on primary button is readable (Auto-Contrast)
                const primLum = getLuminance(b.primaryColor);
                root.style.setProperty("--primary-foreground", primLum < 128 ? "#ffffff" : "#000000");
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
