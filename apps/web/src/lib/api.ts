import axios from "axios";

// [PHASE 16] FORCE RELATIVE PATH to trigger Next.js Rewrite Proxy
const BASE_URL = "/api/v1";

// Helper to get slug dynamically
// Helper to get slug dynamically
const getTenantSlug = () => {
    if (typeof window !== 'undefined') {
        const pathParts = window.location.pathname.split('/').filter(Boolean);

        // Priority 1: URL path part (e.g., /acme/dashboard -> acme)
        if (pathParts.length > 0 && pathParts[0] !== 'auth' && pathParts[0] !== 'dashboard' && pathParts[0] !== 'api') {
            return pathParts[0];
        }

        // Priority 2: Persistent storage
        const stored = localStorage.getItem('tenant_slug');
        if (stored) return stored;

        // Priority 3: Query Params (as a fallback)
        const params = new URLSearchParams(window.location.search);
        const querySlug = params.get('tenant') || params.get('slug');
        if (querySlug) return querySlug;
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
