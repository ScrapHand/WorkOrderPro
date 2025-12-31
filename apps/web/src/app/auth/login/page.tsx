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

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string>("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setDebugInfo("");

        try {
            // ROBUST DEBUGGING Logic as requested
            // 1. Determine API URL
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://workorderpro-backend.onrender.com";

            // 2. Construct Token URL
            // Confirmed Backend Path: /api/v1/auth/login
            // API_URL already contains /api/v1 from Env Var.
            const tokenUrl = `${API_URL}/auth/login`;

            console.log("Attempting login to:", tokenUrl);
            setDebugInfo(`Calling: ${tokenUrl}`);

            // 3. Prepare JSON Payload (Backend expects JSON via express.json())
            const payload = {
                email: email,
                password: password
            };

            // 4. Direct Fetch as JSON
            const res = await fetch(tokenUrl, {
                method: "POST",
                body: JSON.stringify(payload),
                headers: {
                    "Content-Type": "application/json",
                    "X-Tenant-Slug": "default"
                }
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("Login Failed:", res.status, text);
                throw new Error(`Login failed: ${res.status} ${text}`);
            }

            const data = await res.json();

            // 5. Success Handling
            // Store token in cookie
            document.cookie = `access_token=${data.access_token}; path=/; max-age=3600; secure; samesite=strict`;

            toast.success("Login successful");
            router.push("/dashboard");

        } catch (error: any) {
            console.error("Login Error:", error);
            toast.error(error.message || "Failed to login");
            setDebugInfo(prev => `${prev} | Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Sign in to WorkOrderPro</CardTitle>
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
                <div className="p-6 pt-0 text-center text-sm text-muted-foreground">
                    Don't have an account? Contact Admin.
                </div>
            </Card>
        </div>
    );
}
