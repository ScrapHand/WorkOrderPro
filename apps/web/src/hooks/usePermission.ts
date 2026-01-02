"use client";

import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthProvider";

// Define all available features here for type safety
export type FeatureKey =
    | "view_financials"
    | "delete_assets"
    | "create_work_orders"
    | "manage_users"
    | "edit_branding";

export const usePermission = () => {
    const { config } = useTheme(); // contains rbac config
    const { user } = useAuth(); // contains user role

    const hasPermission = (feature: FeatureKey): boolean => {
        if (!user || !config) return false;

        // 1. Admin Override (optional, but usually admins have all)
        // if (user.role === 'ADMIN') return true; 

        // 2. Check RBAC Config
        // Config structure: { "TECHNICIAN": { "view_financials": false }, ... }
        // If config is missing for a role, default to TRUE or FALSE? 
        // Let's default to TRUE for now for backward compatibility, or FALSE for strict security.
        // Requirement says "Toggling OFF ... removes UI". Implies default is ON.

        const roleConfig = config.rbac?.[user.role];

        if (roleConfig && typeof roleConfig[feature] === 'boolean') {
            return roleConfig[feature];
        }

        // Default Defaults
        const defaults: Record<string, boolean> = {
            "view_financials": false, // sensitive
            "delete_assets": false, // sensitive
            "manage_users": false,
            "edit_branding": false,
            "create_work_orders": true // operational
        };

        if (user.role === 'ADMIN') return true;

        return defaults[feature] ?? true;
    };

    return { hasPermission };
};
