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

interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
}

interface TenantContextType {
    tenant: Tenant | null;
    user: User | null;
    isLoading: boolean;
    error: any;
    refreshTenant: () => void;
    refreshUser: () => void;
}

const TenantContext = createContext<TenantContextType>({
    tenant: null,
    user: null,
    isLoading: true,
    error: null,
    refreshTenant: () => { },
    refreshUser: () => { }
});

export const TenantProvider = ({ children, slug }: { children: React.ReactNode, slug: string }) => {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUser = async () => {
        try {
            const res = await api.get('/users/me');
            setUser(res.data);
        } catch (err) {
            console.error("TenantContext: Failed to fetch user", err);
            setUser(null);
        }
    }

    const fetchTenant = async () => {
        console.log("TenantContext: Fetching tenant for slug:", slug);
        if (!slug) {
            console.error("TenantContext: No slug provided!");
            return;
        }
        try {
            setTenantSlugHeader(slug);
            const res = await api.get('/tenants/me');
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
        if (!slug) return;
        setIsLoading(true);
        Promise.all([fetchTenant(), fetchUser()]).finally(() => {
            setIsLoading(false);
        });
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
        }
    }, [tenant]);

    return (
        <TenantContext.Provider value={{
            tenant,
            user,
            isLoading,
            error,
            refreshTenant: fetchTenant,
            refreshUser: fetchUser
        }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => useContext(TenantContext);
