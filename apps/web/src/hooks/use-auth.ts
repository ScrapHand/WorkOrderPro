import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { z } from "zod";
import { useRouter } from "next/navigation";

// Zod Schema for User (Mirroring Backend)
export const UserRoleSchema = z.enum([
    "admin",
    "manager",
    "technician",
    "engineer",
    "viewer",
    "team_leader"
]);

export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    full_name: z.string().nullable(),
    role: UserRoleSchema,
    is_active: z.boolean().default(true),
});

export type User = z.infer<typeof UserSchema>;

export function useUser() {
    return useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            const res = await api.get("/users/me");
            return UserSchema.parse(res.data);
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
            // Backend expects x-www-form-urlencoded for OAuth2
            const res = await api.post("/login/access-token", credentials);
            return res.data;
        },
        onSuccess: () => {
            // Invalidate user query to fetch new profile
            queryClient.invalidateQueries({ queryKey: ["user"] });
            router.push("/dashboard");
        },
    });
}

export function useLogout() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async () => {
            // Create a logout endpoint or just client-side clear?
            // Best to have server-side clearing of cookie
            // For now, we assume we might need to hit an endpoint
            // await api.post("/logout"); 
            // If no logout endpoint, ensuring cookie is cleared is tricky client-side if HttpOnly.
            // We will need a logout endpoint.
        },
        onSuccess: () => {
            queryClient.setQueryData(["user"], null);
            router.push("/login");
        }
    });
}
