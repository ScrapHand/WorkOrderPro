import axios from "axios";

// [PHASE 16] FORCE RELATIVE PATH to trigger Next.js Rewrite Proxy
const BASE_URL = "/api/v1";

// Helper to get slug dynamically
const getTenantSlug = () => {
    if (typeof window !== 'undefined') {
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
        console.log(`[API] Success: ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        if (error.response) {
            console.error(`[API] Error: ${error.response.status} ${error.config.url}`, error.response.data);
        } else {
            console.error(`[API] Network Error: ${error.message}`);
        }
        return Promise.reject(error);
    }
);
