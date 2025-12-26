import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
    baseURL,
});

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
