"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setTenantSlugHeader } from '@/lib/api';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    theme_json?: any;
    // add other fields
}

interface TenantContextType {
    tenant: Tenant | null;
    isLoading: boolean;
    error: any;
    refreshTenant: () => void;
}

const TenantContext = createContext<TenantContextType>({ tenant: null, isLoading: true, error: null, refreshTenant: () => { } });

export const TenantProvider = ({ children, slug }: { children: React.ReactNode, slug: string }) => {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTenant = async () => {
        console.log("TenantContext: Fetching tenant for slug:", slug);
        if (!slug) {
            console.error("TenantContext: No slug provided!");
            return;
        }
        try {
            setTenantSlugHeader(slug);
            console.log("TenantContext: Making API call...");
            const res = await api.get('/tenants/me');
            console.log("TenantContext: API Success", res.data);
            setTenant(res.data);
            setIsLoading(false);
        } catch (err: any) {
            console.error("TenantContext: API Failed", err);
            // Fallback to Mock
            setTenant(prev => ({
                id: 'mock-id',
                name: slug.toUpperCase(),
                slug: slug,
                theme_json: prev?.theme_json || {
                    branding: { logoUrl: null },
                    colors: {}
                }
            }));
            setIsLoading(false);
        }
    };

    useEffect(() => {
        console.log("TenantContext: useEffect trigger, slug=", slug);
        if (!slug) return;
        fetchTenant();
    }, [slug]);

    // Dynamic CSS Variable Injection
    useEffect(() => {
        if (tenant?.theme_json?.colors) {
            const root = document.documentElement;
            const colors = tenant.theme_json.colors;
            Object.entries(colors).forEach(([key, value]) => {
                if (key === 'background') {
                    root.style.setProperty('--background', value as string);
                } else {
                    root.style.setProperty(`--color-${key}`, value as string);
                }
            });
            console.log("TenantContext: Injected dynamic theme variables");
        }
    }, [tenant]);

    return (
        <TenantContext.Provider value={{ tenant, isLoading, error, refreshTenant: fetchTenant }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => useContext(TenantContext);
