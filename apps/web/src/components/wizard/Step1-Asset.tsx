"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Search, Box } from "lucide-react";
import { cn } from "@/lib/utils";

// Types corresponding to backend Asset model (simplified)
type Asset = {
    id: string;
    name: string;
    code: string;
    location?: string;
    status: string;
};

interface Step1Props {
    onSelect: (assetId: string) => void;
    selectedAssetId?: string;
}

export function Step1AssetSelection({ onSelect, selectedAssetId }: Step1Props) {
    const [search, setSearch] = useState("");

    const { data: assets, isLoading } = useQuery({
        queryKey: ["assets", search],
        queryFn: async () => {
            // In a real app, backend should support filtering
            // For now, we fetch all (proto-style) and filter client-side if needed
            // Or if backend supports ?skip=0&limit=100
            const res = await api.get("/assets/?skip=0&limit=100");
            return res.data as Asset[];
        },
    });

    const filteredAssets = assets?.filter((asset) =>
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-1">
                {isLoading && <p className="text-muted-foreground p-4">Loading assets...</p>}

                {filteredAssets?.map((asset) => (
                    <Card
                        key={asset.id}
                        className={cn(
                            "cursor-pointer hover:border-primary transition-all",
                            selectedAssetId === asset.id ? "border-primary bg-primary/5 ring-2 ring-primary" : ""
                        )}
                        onClick={() => onSelect(asset.id)}
                    >
                        <CardContent className="p-4 flex items-start space-x-3">
                            <div className="h-10 w-10 text-primary bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                <Box className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm">{asset.name}</h4>
                                <p className="text-xs text-muted-foreground">{asset.code}</p>
                                {asset.location && (
                                    <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground mt-1 inline-block">
                                        {asset.location}
                                    </span>
                                )}
                            </div>
                            {selectedAssetId === asset.id && (
                                <Check className="h-5 w-5 text-primary" />
                            )}
                        </CardContent>
                    </Card>
                ))}

                {filteredAssets?.length === 0 && (
                    <div className="col-span-full text-center p-8 text-muted-foreground">
                        No assets found matching "{search}"
                    </div>
                )}
            </div>
        </div>
    );
}
