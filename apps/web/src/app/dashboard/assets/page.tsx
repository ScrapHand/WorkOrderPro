"use client";
import { useQuery } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
// import { AssetTree } from "@/components/assets/AssetTree"; // Replacing with InteractiveTree
import { InteractiveTree } from "@/components/assets/tree/InteractiveTree";
import { AssetGrid } from "@/components/assets/AssetGrid";
import { useState } from "react"; // already imported
import { Search, LayoutGrid, Network, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CreateAssetModal } from "@/components/assets/CreateAssetModal";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/lib/auth/types";
import { Asset } from "@/types/asset";

export default function AssetsPage() {
    const { data: user } = useAuth();
    const [view, setView] = useState<"grid" | "tree">("grid");
    // const [rootId, setRootId] = useState("41a408f1-64b1-49a2-b7c1-9f6a458bff78");
    // const [inputVal, setInputVal] = useState(rootId);

    // Edit & Create State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editAsset, setEditAsset] = useState<Asset | null>(null);

    const { data: allAssets, isLoading: isAllLoading, refetch: refetchAll } = useQuery({
        queryKey: ["assets"],
        queryFn: () => AssetService.getAll(),
    });

    const handleSuccess = () => {
        refetchAll();
        setEditAsset(null);
    };

    const isAdminOrManager = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Asset Management</h1>
                    <p className="text-muted-foreground">Manage your physical assets, equipment, and LOTO procedures.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Asset
                    </Button>
                </div>
            </header>

            <Tabs value={view} onValueChange={(v: string) => setView(v as "grid" | "tree")} className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="grid" className="gap-2">
                            <LayoutGrid className="h-4 w-4" /> Grid View
                        </TabsTrigger>
                        <TabsTrigger value="tree" className="gap-2">
                            <Network className="h-4 w-4" /> Hierarchy Tree (Interactive)
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="grid" className="mt-0">
                    {isAllLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />)}
                        </div>
                    ) : (
                        <AssetGrid
                            assets={allAssets || []}
                            isAdmin={isAdminOrManager}
                            onEdit={setEditAsset}
                        />
                    )}
                </TabsContent>

                <TabsContent value="tree" className="mt-0 space-y-4">
                    {/* [UX] Removed confusing "Root ID" input. Now auto-loads all assets. */}

                    {isAllLoading && <p>Loading hierarchy...</p>}
                    {!isAllLoading && allAssets && (
                        <div className="h-[600px] bg-white rounded-xl border overflow-hidden">
                            <InteractiveTree
                                assets={allAssets} // Pass all assets, component handles tree building
                                onNodeClick={(asset) => isAdminOrManager ? setEditAsset(asset) : null}
                            />
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Shared Create/Edit Modal */}
            {(isCreateModalOpen || editAsset) && (
                <CreateAssetModal
                    open={isCreateModalOpen || !!editAsset}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsCreateModalOpen(false);
                            setEditAsset(null);
                        }
                    }}
                    initialData={editAsset}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}
