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

// Convert Hex to HSL string for CSS
function hexToHsl(hex: string) {
    let c = hex.substring(1);
    if (c.length === 3) c = c.split('').map(i => i + i).join('');
    const rgb = parseInt(c, 16);
    let r = (rgb >> 16) & 0xff;
    let g = (rgb >> 8) & 0xff;
    let b = (rgb >> 0) & 0xff;

    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    // Return CSS string: hsl(h s% l%)
    return `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
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

            const setVar = (name: string, val: string) => {
                root.style.setProperty(name, val);
                document.body.style.setProperty(name, val); // Fallback for body overrides
            };

            // 1. Auto-detect Dark Mode based on Background Color
            if (b.backgroundColor) {
                const lum = getLuminance(b.backgroundColor);
                if (lum < 0.2) { // Adjusted threshold for better dark mode detection (approx < 50/255)
                    root.classList.add("dark");
                } else {
                    root.classList.remove("dark");
                }
            }

            // 2. Apply CSS Variables
            if (b.primaryColor) {
                setVar("--primary", hexToHsl(b.primaryColor));

                // Auto-Contrast for Foreground
                const primLum = getLuminance(b.primaryColor);
                setVar("--primary-foreground", primLum < 128 ? "#ffffff" : "#0f172a"); // White or Dark Slate
            }
            if (b.secondaryColor) {
                setVar("--secondary", hexToHsl(b.secondaryColor));
                setVar("--secondary-foreground", "#ffffff");
            }
            if (b.textColor) {
                setVar("--foreground", hexToHsl(b.textColor));
            }
            if (b.backgroundColor) {
                setVar("--background", hexToHsl(b.backgroundColor));
            }
            if (b.mutedColor) {
                setVar("--muted", hexToHsl(b.mutedColor));
            }
            if (b.font) {
                setVar("--font-sans", b.font);
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
