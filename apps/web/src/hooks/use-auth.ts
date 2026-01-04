"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { User, UserRole } from "@/lib/auth/types";

// Re-export specific hook for RoleGuard
export const useAuth = useUser;

export function useUser() {
    return useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            const res = await api.get("/auth/me");
            // [PHASE 25.5] Fix Data Mismatch
            // API returns { isAuthenticated: true, user: { ... } }
            // We must unwrap it to return just the User object
            if (res.data && res.data.user) {
                return res.data.user as User;
            }
            return res.data as User; // Fallback if structure flat
        },
        retry: false, // Fail fast on 401
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useLogin() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async (credentials: FormData) => {
            // Check for tenant_slug override
            const tenantSlug = credentials.get("tenant_slug")?.toString();

            const config = tenantSlug ? {
                headers: {
                    "X-Tenant-Slug": tenantSlug
                }
            } : undefined;

            // Backend expects x-www-form-urlencoded for OAuth2
            // Endpoint is mounted at /auth in api.py, and defines /login (so /auth/login)
            const res = await api.post("/auth/login", credentials, config);
            return res.data;
        },
        onSuccess: async (_, variables) => {
            // Store Tenant Slug for future requests
            const tenantSlug = variables.get("tenant_slug")?.toString();
            if (tenantSlug) {
                localStorage.setItem("tenant_slug", tenantSlug);
            } else {
                localStorage.setItem("tenant_slug", "default");
            }

            // Invalidate to ensure we don't have stale guest data
            await queryClient.invalidateQueries({ queryKey: ["user"] });

            // Fetch fresh user data to determine redirect
            // We use fetchQuery to bypass the cache we just invalidated/stale-d
            try {
                const user = await queryClient.fetchQuery({
                    queryKey: ["user"],
                    queryFn: async () => {
                        const res = await api.get("/auth/me");
                        return res.data as User;
                    },
                    staleTime: 0 // Ensure fresh
                });

                const slug = tenantSlug || "default";
                if (user.role === UserRole.TECHNICIAN) {
                    router.push(`/${slug}/dashboard/work-orders`);
                } else {
                    router.push(`/${slug}/dashboard`);
                }
            } catch (error) {
                // Fallback if user fetch fails (weird edge case)
                console.error("Failed to fetch user after login", error);
                router.push(`/${tenantSlug || "default"}/dashboard`);
            }
        },
    });
}

export function useLogout() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async () => {
            // await api.post("/logout"); 
        },
        onSuccess: () => {
            queryClient.setQueryData(["user"], null);
            router.push("/auth/login"); // Correct path
        }
    });
}
