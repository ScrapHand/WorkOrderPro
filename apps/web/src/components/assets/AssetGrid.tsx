"use client";

import { Asset } from "@/types/asset";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AssetCard } from "./asset-card";
import { useState } from "react";
import { AssetDocsModal } from "./AssetDocsModal"; // We will create this next
import { AssetLotoModal } from "./AssetLotoModal"; // We will create this next
import { AssetService } from "@/services/asset.service";
// import { CreateAssetModal } from "./CreateAssetModal"; // Removed as we lift state

interface AssetGridProps {
    assets: Asset[];
    isAdmin?: boolean;
    onEdit?: (asset: Asset) => void;
}

export function AssetGrid({ assets, isAdmin, onEdit }: AssetGridProps) {
    const [selectedDocsAsset, setSelectedDocsAsset] = useState<Asset | null>(null);
    const [selectedLotoAsset, setSelectedLotoAsset] = useState<Asset | null>(null);
    // const [editAsset, setEditAsset] = useState<Asset | null>(null); // Lifted up
    const queryClient = useQueryClient();

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to decommission this asset?")) return;
        try {
            await AssetService.delete(id);
            toast.success("Asset decommissioned");
            queryClient.invalidateQueries({ queryKey: ["assets"] });
        } catch (error) {
            toast.error("Failed to delete asset");
        }
    };

    return (
        <>
            {assets.length === 0 ? (
                <div className="text-center p-12 bg-muted/30 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">No assets found. Create your first asset to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {assets.map((asset) => (
                        <AssetCard
                            key={asset.id}
                            asset={asset}
                            onViewDocs={(a) => setSelectedDocsAsset(a)}
                            onViewLoto={(a) => setSelectedLotoAsset(a)}
                            onEdit={isAdmin && onEdit ? onEdit : undefined}
                            onDelete={isAdmin ? handleDelete : undefined}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            {selectedDocsAsset && (
                <AssetDocsModal
                    open={!!selectedDocsAsset}
                    onOpenChange={(open: boolean) => !open && setSelectedDocsAsset(null)}
                    asset={selectedDocsAsset}
                />
            )}

            {selectedLotoAsset && (
                <AssetLotoModal
                    open={!!selectedLotoAsset}
                    onOpenChange={(open: boolean) => !open && setSelectedLotoAsset(null)}
                    asset={selectedLotoAsset}
                />
            )}
        </>
    );
}
