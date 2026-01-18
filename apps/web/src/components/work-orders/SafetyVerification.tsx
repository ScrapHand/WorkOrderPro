"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, CheckCircle2, AlertTriangle, Zap, Droplets, Wind, Info } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface SafetyVerificationProps {
    workOrder: any;
    onVerified?: () => void;
}

export function SafetyVerification({ workOrder, onVerified }: SafetyVerificationProps) {
    const params = useParams();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<"electrical" | "pneumatic" | "hydraulic">("electrical");
    const tenantSlug = params.tenantSlug as string || 'default';

    const asset = workOrder.asset;
    const lotoConfig = (asset?.lotoConfig as any) || {};

    // Check if any isolation points are defined
    const hasIsolation = Object.values(lotoConfig).some((val: any) =>
        Array.isArray(val) ? val.length > 0 : !!val
    );

    const verifyMutation = useMutation({
        mutationFn: () => AssetService.verifySafety(workOrder.id),
        onSuccess: () => {
            toast.success("Safety protocols verified. You can now start the work.");
            queryClient.invalidateQueries({ queryKey: ["workOrder", workOrder.id] });
            if (onVerified) onVerified();
        },
        onError: (err: any) => {
            toast.error(`Verification failed: ${err.message}`);
        }
    });

    const getImages = (type: string): string[] => {
        const val = lotoConfig[type];
        if (!val) return [];
        if (Array.isArray(val)) return val;
        return [val];
    };

    const getImageUrl = (url: string) => {
        if (!url) return "";
        if (url.includes('/api/v1/upload/proxy')) return url;
        if (url.includes('amazonaws.com')) {
            try {
                const urlObj = new URL(url);
                const path = urlObj.pathname;
                const match = path.match(/tenants\/.+/);
                if (!match) return url;
                const key = match[0];
                const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://work-order-pro-backend.onrender.com').replace(/\/api\/v1\/?$/, '');
                return `${apiBase}/api/v1/upload/proxy?key=${key}&tenant=${tenantSlug}`;
            } catch (e) {
                return url;
            }
        }
        return url;
    };

    if (!hasIsolation) return null;

    if (workOrder.lotoVerified) {
        return (
            <Card className="border-green-200 bg-green-50/10">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <CardTitle className="text-green-800">Safety Verified</CardTitle>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                            LOTO PASS
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-green-700">
                        Isolation points were verified on {new Date(workOrder.lotoVerifiedAt).toLocaleString()}.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const currentImages = getImages(activeTab);

    return (
        <Card className="border-red-200 bg-red-50/5 shadow-md overflow-hidden">
            <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    SAFETY CRITICAL: LOTO REQUIRED
                </div>
            </div>
            <CardContent className="pt-6">
                <div className="flex gap-6 h-[260px]">
                    <div className="w-32 flex flex-col gap-2">
                        <button
                            onClick={() => setActiveTab('electrical')}
                            className={`flex items-center gap-2 p-2 rounded-md text-xs font-bold transition-all ${activeTab === 'electrical' ? 'bg-red-100 text-red-700 shadow-sm border-l-4 border-red-600' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <Zap className="h-3 w-3" /> Electrical
                        </button>
                        <button
                            onClick={() => setActiveTab('pneumatic')}
                            className={`flex items-center gap-2 p-2 rounded-md text-xs font-bold transition-all ${activeTab === 'pneumatic' ? 'bg-blue-100 text-blue-700 shadow-sm border-l-4 border-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <Wind className="h-3 w-3" /> Pneumatic
                        </button>
                        <button
                            onClick={() => setActiveTab('hydraulic')}
                            className={`flex items-center gap-2 p-2 rounded-md text-xs font-bold transition-all ${activeTab === 'hydraulic' ? 'bg-purple-100 text-purple-700 shadow-sm border-l-4 border-purple-600' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <Droplets className="h-3 w-3" /> Hydraulic
                        </button>

                        <div className="mt-auto p-2 bg-gray-100 rounded text-[10px] text-gray-600 leading-tight border border-gray-200">
                            <strong>Sign-off:</strong> Click verify after confirming all energy sources are locked.
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2">
                        {currentImages.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {currentImages.map((url, idx) => (
                                    <div key={idx} className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden border">
                                        <img
                                            src={getImageUrl(url)}
                                            alt={`LOTO ${activeTab}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 border-2 border-dashed rounded-lg">
                                <Lock className="h-8 w-8 mb-2 opacity-20" />
                                <p className="text-xs font-medium">No {activeTab} isolation defined</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between bg-red-50 p-4 rounded-lg border border-red-100">
                    <div className="flex items-center gap-3 text-red-900">
                        <div className="p-2 bg-white rounded-full border border-red-200">
                            <Lock className="h-4 w-4" />
                        </div>
                        <div className="text-sm">
                            <span className="font-bold block">Physical Lockout Confirmed?</span>
                            <span className="text-xs opacity-75">Verification will be recorded under your account.</span>
                        </div>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => verifyMutation.mutate()}
                        disabled={verifyMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 shadow-lg"
                    >
                        {verifyMutation.isPending ? "Verifying..." : "Sign-off & Verify Safety"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
