
"use client";

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface TenantFeatures {
    factoryLayout?: boolean;
    inventoryIntelligence?: boolean;
    shiftAnalytics?: boolean;
    autoDispatch?: boolean;
    assetTelemetry?: boolean;
    safetySignOffs?: boolean;
    workOrderSLA?: boolean;
    vendorPortal?: boolean;
    costAnalytics?: boolean;
}

/**
 * Hook to check if a specific feature is enabled for the current tenant.
 */
export function useFeatures() {
    const { data: tenantConfig } = useQuery({
        queryKey: ['current-tenant-config'],
        queryFn: async () => {
            const { data } = await api.get('/tenant/config');
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const features: TenantFeatures = tenantConfig?.features || {};

    const isEnabled = (featureKey: keyof TenantFeatures): boolean => {
        return !!features[featureKey];
    };

    return { features, isEnabled, isLoading: !tenantConfig };
}
