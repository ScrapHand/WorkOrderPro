"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AssetTree } from "@/components/assets/AssetTree";
import { CreateAssetModal } from "@/components/assets/CreateAssetModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AssetTreePage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedParent, setSelectedParent] = useState<{ id: string; name: string } | null>(null);

    const { data: assets, isLoading, refetch } = useQuery({
        queryKey: ["assets"],
        queryFn: async () => {
            const res = await api.get("/assets");
            return res.data;
        }
    });

    const handleAddRoot = () => {
        setSelectedParent(null);
        setIsCreateOpen(true);
    };

    const handleAddChild = (parentId: string) => {
        // Find parent logic if needed for name, though ID is enough
        const parent = assets?.find((a: any) => a.id === parentId);
        setSelectedParent({ id: parentId, name: parent?.name || "Unknown" });
        setIsCreateOpen(true);
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Asset Hierarchy</h2>
                    <p className="text-muted-foreground">Manage your asset tree structure.</p>
                </div>
                <Button onClick={handleAddRoot}>
                    <Plus className="mr-2 h-4 w-4" /> Add Root Asset
                </Button>
            </div>

            <div className="flex-1 min-h-[500px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">Loading tree...</div>
                ) : (
                    <AssetTree
                        assets={assets || []}
                        onAddChild={handleAddChild}
                    />
                )}
            </div>

            <CreateAssetModal
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                parentId={selectedParent?.id}
                parentName={selectedParent?.name}
                onSuccess={() => refetch()}
            />
        </div>
    );
}
