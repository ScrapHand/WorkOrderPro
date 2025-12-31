"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DebugInfo {
    status: string;
    timestamp: string;
    context: {
        tenantId: string;
        slug: string;
        userRole: string;
        nodeEnv: string;
    };
    database: {
        status: string;
    };
}

export default function SystemStatusPage() {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["system-status"],
        queryFn: async () => {
            const res = await api.get("/debug/tenant");
            return res.data as DebugInfo;
        },
        retry: 0
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "N/A";

    // Cookie Check (Naive)
    const hasAuthCookie = typeof document !== 'undefined' && document.cookie.includes('connect.sid');

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Doctor</h1>
                    <p className="text-muted-foreground">Diagnostics and Connectivity Status</p>
                </div>
                <Button onClick={() => refetch()} variant="outline">
                    Refresh Diagnostics
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Frontend Context */}
                <Card>
                    <CardHeader>
                        <CardTitle>Frontend Environment</CardTitle>
                        <CardDescription>Configuration detected in Browser</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">API URL</span>
                            <code className="bg-muted px-2 py-1 rounded text-xs">{apiUrl}</code>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Session Cookie</span>
                            {hasAuthCookie ? (
                                <span className="flex items-center text-green-600 text-sm">
                                    <CheckCircle2 className="w-4 h-4 mr-1" /> Present
                                </span>
                            ) : (
                                <span className="flex items-center text-amber-600 text-sm">
                                    <XCircle className="w-4 h-4 mr-1" /> Missing/HttpOnly
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Backend Connection */}
                <Card className={error ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                    <CardHeader>
                        <CardTitle className={error ? "text-red-700" : "text-green-700"}>
                            Backend Connectivity
                        </CardTitle>
                        <CardDescription>
                            GET /api/v1/debug/tenant
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking connection...
                            </div>
                        ) : error ? (
                            <div className="space-y-2 text-red-700">
                                <div className="flex items-center font-bold">
                                    <XCircle className="mr-2 h-5 w-5" /> Connection Failed
                                </div>
                                <p className="text-xs font-mono bg-red-100 p-2 rounded">
                                    {(error as any).message}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4 text-green-800">
                                <div className="flex items-center font-bold text-lg">
                                    <CheckCircle2 className="mr-2 h-6 w-6" /> Online
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm bg-white/50 p-2 rounded">
                                    <div className="text-muted-foreground">DB Status:</div>
                                    <div className="font-mono">{data?.database?.status}</div>

                                    <div className="text-muted-foreground">Tenant Slug:</div>
                                    <div className="font-mono">{data?.context?.slug}</div>

                                    <div className="text-muted-foreground">Your Role:</div>
                                    <div className="font-mono font-bold">{data?.context?.userRole}</div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
