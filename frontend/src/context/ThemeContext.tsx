"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { useTenant } from './TenantContext';

interface ThemeContextType {
    // helpers to change theme if needed
}

const ThemeContext = createContext<ThemeContextType>({});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { tenant } = useTenant();

    useEffect(() => {
        if (tenant?.theme_json?.colors) {
            const root = document.documentElement;
            const colors = tenant.theme_json.colors;

            // Set CSS variables dynamically
            Object.entries(colors).forEach(([key, value]) => {
                // CamelCase to kebab-case for CSS vars if needed, or just use key if checking matches
                // For simplicity, we assume keys like 'primary', 'surface' map to '--color-primary', '--surface' etc.
                // Or consistent '--color-{key}'

                // We'll use --color-{key} convention for all
                // Special case: background might clash if we use --background directly without color prefix in some systems,
                // but we used --background in globals.css.
                // Let's stick to what globals.css expects.

                if (key === 'background') root.style.setProperty('--background', value as string);
                else root.style.setProperty(`--color-${key}`, value as string);
            });
        }
    }, [tenant]);

    return (
        <ThemeContext.Provider value={{}}>
            {children}
        </ThemeContext.Provider>
    );
};
