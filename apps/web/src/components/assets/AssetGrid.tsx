"use client";

import { Asset } from "@/types/asset";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AssetCard } from "./asset-card";
import { useState } from "react";
import { AssetDocsModal } from "./AssetDocsModal"; // We will create this next
import { AssetLotoModal } from "./AssetLotoModal"; // We will create this next
import { AssetSpecsModal } from "./AssetSpecsModal"; // [NEW]
import { AssetService } from "@/services/asset.service";
// import { CreateAssetModal } from "./CreateAssetModal"; // Removed as we lift state

import { useAuth } from "@/hooks/use-auth"; // [RBAC]
import { UserRole } from "@/lib/auth/types";

interface AssetGridProps {
    assets: Asset[];
    onEdit?: (asset: Asset) => void;
}

export function AssetGrid({ assets, onEdit }: AssetGridProps) {
    const { data: user } = useAuth();

    // [RBAC] Permission Check Helper
    const canEdit = user && (
        ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'ADMIN'].includes(user.role) ||
        user.permissions?.includes('*') ||
        user.permissions?.includes('asset:write')
    );

    const canDelete = user && (
        ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'ADMIN'].includes(user.role) ||
        user.permissions?.includes('*') ||
        user.permissions?.includes('asset:delete')
    );

    const [selectedDocsAssetId, setSelectedDocsAssetId] = useState<string | null>(null);
    const [selectedLotoAssetId, setSelectedLotoAssetId] = useState<string | null>(null);
    const [selectedSpecsAssetId, setSelectedSpecsAssetId] = useState<string | null>(null);

    // Derive current asset from list to ensure fresh data after refetch
    const selectedDocsAsset = assets.find(a => a.id === selectedDocsAssetId);
    const selectedLotoAsset = assets.find(a => a.id === selectedLotoAssetId);
    const selectedSpecsAsset = assets.find(a => a.id === selectedSpecsAssetId);

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
                            onViewDocs={(a) => setSelectedDocsAssetId(a.id)}
                            onViewLoto={(a) => setSelectedLotoAssetId(a.id)}
                            onViewSpecs={(a) => setSelectedSpecsAssetId(a.id)}
                            onEdit={canEdit && onEdit ? onEdit : undefined}
                            onDelete={canDelete ? handleDelete : undefined}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            {selectedDocsAsset && (
                <AssetDocsModal
                    open={!!selectedDocsAssetId}
                    onOpenChange={(open: boolean) => !open && setSelectedDocsAssetId(null)}
                    asset={selectedDocsAsset}
                />
            )}

            {selectedLotoAsset && (
                <AssetLotoModal
                    open={!!selectedLotoAssetId}
                    onOpenChange={(open: boolean) => !open && setSelectedLotoAssetId(null)}
                    asset={selectedLotoAsset}
                />
            )}

            {selectedSpecsAsset && (
                <AssetSpecsModal
                    open={!!selectedSpecsAssetId}
                    onOpenChange={(open: boolean) => !open && setSelectedSpecsAssetId(null)}
                    asset={selectedSpecsAsset}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ["assets"] })}
                />
            )}
        </>
    );
}
