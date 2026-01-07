"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthProvider";
import { ThemeProvider as TenantThemeProvider } from "@/context/ThemeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // DATA FRESHNESS STRATEGY
                        // 1. Mark data stale immediately. This triggers background refetches 
                        //    whenever a component mounts or key changes.
                        staleTime: 0,

                        // 2. Auto-refetch when user focuses the window.
                        //    Crucial for "Live" feel in multi-tab workflows.
                        refetchOnWindowFocus: true,

                        // 3. Retry logic: prevent infinite loading spirals on persistent 4xx errors
                        retry: (failureCount, error: any) => {
                            if (error.response?.status === 404 || error.response?.status === 403) return false;
                            return failureCount < 2;
                        },
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <NextThemesProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <AuthProvider>
                    <TenantThemeProvider>
                        {children}
                    </TenantThemeProvider>
                </AuthProvider>
            </NextThemesProvider>
        </QueryClientProvider>
    );
}
