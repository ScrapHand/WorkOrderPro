import axios from "axios";

// Default to localhost:8000 for dev if env not set
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Critical for Cookies
    headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": "default", // Required by Backend
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Optional: Handle global 401 redirects here or let React Query handle it
        return Promise.reject(error);
    }
);
