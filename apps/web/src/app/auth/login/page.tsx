"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

import { useQueryClient } from "@tanstack/react-query"; // [PHASE 25] State Sync

export default function LoginPage() {
    const router = useRouter();
    const queryClient = useQueryClient(); // [PHASE 25]
    const { config } = useTheme();
    const logoUrl = config?.branding?.logoUrl;
    const appName = config?.branding?.appName || "WorkOrderPro";
    const [email, setEmail] = useState("");


    // [AUTO-DETECT] Removed manual tenant input
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string>("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setDebugInfo("");

        try {
            // [PHASE 23] USE PROXY CLIENT
            // This ensures the request goes to /api/v1/auth/login via Next.js Rewrite
            console.log("Attempting login via Proxy...");
            setDebugInfo(`Calling: /auth/login`);

            const payload = {
                email: email,
                password: password,
                // tenant_slug: Removed (Auto Detect)
            };

            // Use the centralized API client (cookies handled automatically)
            // Send X-Tenant-Slug header as requested to "prime" the context
            // @ts-ignore
            const { data } = await import("@/lib/api").then(m => m.api.post("/auth/login", payload, {
                headers: { 'X-Tenant-Slug': 'default' } // Placeholder, backend ignores for login
            }));

            console.log("Login Success:", data);

            // [PHASE 25] Frontend State Sync (Fix)
            // 1. Prime the cache immediately so useAuth() returns data instantly
            queryClient.setQueryData(["user"], data.user);

            // 2. Invalidate caches to ensure fresh data elsewhere
            await queryClient.invalidateQueries({ queryKey: ["user"] });
            await queryClient.invalidateQueries({ queryKey: ["system-status"] });

            // [PHASE 23] No manual cookie setting needed.
            // The Set-Cookie header from the response is handled by the browser automatically.

            toast.success("Login successful");

            // Prefer server-provided slug, fallback to storage, then default
            const slug = data.tenant?.slug || localStorage.getItem("tenant_slug") || "default";

            // Update storage for next time
            localStorage.setItem("tenant_slug", slug);

            router.push(`/${slug}/dashboard`);

        } catch (error: any) {
            console.error("Login Error:", error);
            const msg = error.response?.data?.error || error.message || "Failed to login";
            toast.error(msg);
            setDebugInfo(prev => `${prev} | Error: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1 text-center">
                    {logoUrl && (
                        <div className="flex justify-center mb-6">
                            <img src={logoUrl} alt={appName} className="h-32 w-auto object-contain" />
                        </div>
                    )}
                    <CardTitle className="text-2xl font-bold">Sign in to {appName}</CardTitle>
                    <CardDescription>
                        Enter your email and password to access your account.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link href="#" className="text-sm text-primary underline-offset-4 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {debugInfo && (
                            <div className="bg-muted p-2 rounded text-xs font-mono text-muted-foreground break-all">
                                {debugInfo}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </CardFooter>
                </form>
                <div className="p-6 pt-0 text-center space-y-2">
                    <div className="text-sm text-muted-foreground">
                        Don't have an account? Contact Admin.
                    </div>
                    <div className="bg-blue-50 border border-blue-100 p-2 rounded text-[10px] text-blue-600 font-medium">
                        Tip: Demo Admin password is <span className="font-bold">ScrapHand</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
