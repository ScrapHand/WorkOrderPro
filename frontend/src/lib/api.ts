import axios from 'axios';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const API_URL = BASE_URL.includes('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;

export const api = axios.create({
    baseURL: API_URL,
});

/**
 * Resolves a potentially relative backend path (e.g. /static/...) 
 * to a full absolute URL using the backend origin.
 */
export const resolveBackendUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;

    // Ensure BASE_URL doesn't have trailing slash for joining
    const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
};

// Interceptor to add token and tenant slug
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const tenantSlug = localStorage.getItem('tenantSlug');

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        if (tenantSlug) {
            config.headers['X-Tenant-Slug'] = tenantSlug;
        }

        // Debug Log
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
            hasToken: !!token,
            tenantSlug
        });
    }
    return config;
});

// Response interceptor to handle global errors (like 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error("Session expired or unauthorized.", error.config.url);
        }
        return Promise.reject(error);
    }
);

export const setAuthToken = (token: string) => {
    localStorage.setItem('token', token);
    // Also explicitly set in defaults for immediate effect
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
};

export const setTenantSlugHeader = (slug: string) => {
    localStorage.setItem('tenantSlug', slug);
    if (slug) {
        api.defaults.headers.common['X-Tenant-Slug'] = slug;
    }
}
