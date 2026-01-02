"use client";
import { useQuery } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { InteractiveTree } from "@/components/assets/tree/InteractiveTree";
import { useState } from "react";
import { UserRole } from "@/lib/auth/types";
import { useAuth } from "@/hooks/use-auth";
import { CreateAssetModal } from "@/components/assets/CreateAssetModal";
import { Asset } from "@/types/asset";

export default function AssetTreePage() {
    const { data: user } = useAuth();
    const isAdminOrManager = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

    // Edit State (for Tree clicks)
    const [editAsset, setEditAsset] = useState<Asset | null>(null);

    const { data: allAssets, isLoading, refetch } = useQuery({
        queryKey: ["assets"],
        queryFn: () => AssetService.getAll(),
    });

    const handleSuccess = () => {
        refetch();
        setEditAsset(null);
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Asset Hierarchy</h1>
                <p className="text-muted-foreground">Interactive visual map of your asset relationships.</p>
            </header>

            <div className="h-[calc(100vh-12rem)] bg-white rounded-xl border overflow-hidden shadow-sm">
                {isLoading && <div className="flex items-center justify-center h-full">Loading hierarchy...</div>}
                {!isLoading && allAssets && (
                    <InteractiveTree
                        assets={allAssets}
                        onNodeClick={(asset) => isAdminOrManager ? setEditAsset(asset) : null}
                    />
                )}
            </div>

            {/* Edit Modal */}
            {editAsset && (
                <CreateAssetModal
                    open={!!editAsset}
                    onOpenChange={(open) => !open && setEditAsset(null)}
                    initialData={editAsset}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}
