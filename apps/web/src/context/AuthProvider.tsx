"use client";

import { useUser } from "@/hooks/use-auth";
import { User } from "@/lib/auth/types";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: user, isLoading, isError } = useUser();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Force fetch on mount is handled by useQuery in useUser

    // Prevent hydration mismatch or flicker?
    // For now, just expose the user query result via Context so it's globally available

    return (
        <AuthContext.Provider value={{
            user: user || null,
            isLoading,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);
export const useAuth = useAuthContext;
