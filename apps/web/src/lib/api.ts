import axios from "axios";

// [PHASE 16] FORCE RELATIVE PATH to trigger Next.js Rewrite Proxy
const BASE_URL = "/api/v1";

// Helper to get slug dynamically
// Helper to get slug dynamically
const getTenantSlug = () => {
    if (typeof window !== 'undefined') {
        // [FIX] Prioritize URL path for Global Admin context switching
        // url structure: /[tenantSlug]/...
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length >= 2 && pathParts[1] && pathParts[1] !== 'auth' && pathParts[1] !== 'dashboard') {
            // Basic check: avoid grabbing 'auth' or 'dashboard' if they are root (though usually they are nested)
            // Assuming structure /[slug]/dashboard
            // If structure is /dashboard (for default), simple split might be tricky.
            // Better regex or check.

            // Common pattern: /[slug]/...
            // If slug is 'default', it might be implicit or explicit.
            return pathParts[1];
        }

        return localStorage.getItem('tenant_slug') || 'default';
    }
    return 'default';
};

export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Critical for Cookies
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor: Inject Tenant Slug & Log
api.interceptors.request.use((config) => {
    // [FIX] Only inject if not already present (allows overrides for Login)
    if (!config.headers['X-Tenant-Slug']) {
        config.headers['X-Tenant-Slug'] = getTenantSlug();
    }

    // [DEBUG] Log Request - Reduced Noise
    // console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    return config;
});

// Response Interceptor: Log results or errors
api.interceptors.response.use(
    (response) => {
        // console.log(`[API] Success: ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        if (error.response) {
            console.error(`[API] Error: ${error.response.status} ${error.config.url}`, error.response.data);

            // [REMEDIATION] Handle Session Expiry
            if (error.response.status === 401) {
                // Prevent redirect loops if already on login page
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
                    console.warn('Session expired or unauthorized. Redirecting to login.');
                    // window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
                }
            }

            // [REMEDIATION] Handle Forbidden Access
            if (error.response.status === 403) {
                console.error('Access Forbidden: Insufficient Permissions');
            }
        } else {
            console.error(`[API] Network Error: ${error.message}`);
        }
        return Promise.reject(error);
    }
);
