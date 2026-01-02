"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Asset } from "@/types/asset";
import { AssetService } from "@/services/asset.service";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Zap,
    Wind,
    Droplets,
    FileText,
    History,
    Trash2,
    Package
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface AssetGridProps {
    assets: Asset[];
    isAdmin?: boolean;
}

export function AssetGrid({ assets, isAdmin }: AssetGridProps) {
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: (id: string) => AssetService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            toast.success("Asset decommissioned successfully");
        },
        onError: (err: any) => {
            toast.error("Failed to decommission asset: " + (err.response?.data?.error || err.message));
        }
    });

    if (assets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-dashed rounded-xl">
                <Package className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground">No assets found matching your criteria.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
                <Card key={asset.id} className="group hover:shadow-lg transition-all border-border/60 overflow-hidden">
                    <div className="aspect-video w-full bg-muted relative">
                        {asset.imageUrl ? (
                            <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-1">
                            {asset.lotoConfig?.electrical && (
                                <div className="bg-yellow-100 p-1.5 rounded-full border border-yellow-200 shadow-sm" title="Electrical LOTO Available">
                                    <Zap className="h-3.5 w-3.5 text-yellow-700" />
                                </div>
                            )}
                            {asset.lotoConfig?.pneumatic && (
                                <div className="bg-blue-100 p-1.5 rounded-full border border-blue-200 shadow-sm" title="Pneumatic LOTO Available">
                                    <Wind className="h-3.5 w-3.5 text-blue-700" />
                                </div>
                            )}
                            {asset.lotoConfig?.hydraulic && (
                                <div className="bg-cyan-100 p-1.5 rounded-full border border-cyan-200 shadow-sm" title="Hydraulic LOTO Available">
                                    <Droplets className="h-3.5 w-3.5 text-cyan-700" />
                                </div>
                            )}
                        </div>
                    </div>

                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg font-bold">{asset.name}</CardTitle>
                                <p className="text-xs text-muted-foreground line-clamp-1">{asset.description || "No description"}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                                ${asset.status === 'OPERATIONAL' ? 'bg-green-100 text-green-700' :
                                    asset.status === 'DOWN' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {asset.status}
                            </span>
                        </div>
                    </CardHeader>

                    <CardContent className="pb-4">
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-8 flex-1 gap-2 text-xs" asChild>
                                <a href={asset.lotoConfig?.electrical || asset.lotoConfig?.pneumatic || asset.lotoConfig?.hydraulic || "#"} target="_blank">
                                    <FileText className="h-3.5 w-3.5" /> Docs
                                </a>
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 flex-1 gap-2 text-xs" asChild>
                                <Link href={`/dashboard/work-orders?assetId=${asset.id}`}>
                                    <History className="h-3.5 w-3.5" /> History
                                </Link>
                            </Button>
                        </div>
                    </CardContent>

                    {isAdmin && (
                        <CardFooter className="pt-0 pb-4 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 h-8 gap-2"
                                onClick={() => {
                                    if (confirm(`Are you sure you want to decommission ${asset.name}?`)) {
                                        deleteMutation.mutate(asset.id);
                                    }
                                }}
                                disabled={deleteMutation.isPending}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Decommission
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            ))}
        </div>
    );
}
