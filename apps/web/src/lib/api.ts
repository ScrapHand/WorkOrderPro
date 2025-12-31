import axios from "axios";

// Default to localhost:8000 for dev if env not set
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Critical for Cookies
    headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": "default", // Required by Backend
    },
});

// Request Interceptor: Log outgoing requests
api.interceptors.request.use((config) => {
    // [DEBUG] Log Request
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
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
