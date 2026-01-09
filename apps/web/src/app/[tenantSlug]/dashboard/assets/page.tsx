"use client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AssetService } from "@/services/asset.service";
// import { AssetTree } from "@/components/assets/AssetTree"; // Replacing with InteractiveTree
import { InteractiveTree } from "@/components/assets/tree/InteractiveTree";
import { AssetGrid } from "@/components/assets/AssetGrid";
import { useState } from "react"; // already imported
import { Plus, LayoutGrid, Network, Database, Kanban } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CreateAssetModal } from "@/components/assets/CreateAssetModal";
import { AssetTemplatePicker } from "@/components/assets/AssetTemplatePicker";
import BulkImportModal from "@/components/assets/BulkImportModal";
import { useAuth } from "@/hooks/use-auth";
import { RoleGuard } from "@/components/auth/role-guard";
import { Asset } from "@/types/asset";

import { AssetGroupBoard } from "@/components/assets/AssetGroupBoard";

export default function AssetsPage() {
    const { data: user } = useAuth();
    const [view, setView] = useState<"grid" | "tree" | "board">("grid"); // Add 'board'
    // const [rootId, setRootId] = useState("41a408f1-64b1-49a2-b7c1-9f6a458bff78");
    // const [inputVal, setInputVal] = useState(rootId);

    // Edit & Create State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [editAsset, setEditAsset] = useState<Asset | null>(null);
    const [createParentId, setCreateParentId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: allAssets, isLoading: isAllLoading, refetch: refetchAll } = useQuery({
        queryKey: ["assets"],
        queryFn: () => AssetService.getAll(),
    });

    // Filter Assets based on search query
    const filteredAssets = (allAssets || []).filter(asset => {
        const query = searchQuery.toLowerCase();
        return (
            asset.name.toLowerCase().includes(query) ||
            asset.code?.toLowerCase().includes(query) ||
            asset.description?.toLowerCase().includes(query)
        );
    });

    const handleSuccess = () => {
        refetchAll();
        setEditAsset(null);
        setCreateParentId(null);
    };

    const canEdit = user && (
        ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'ADMIN'].includes(user.role) ||
        user.permissions?.includes('*') ||
        user.permissions?.includes('asset:write')
    );

    const deleteMutation = useMutation({
        mutationFn: (id: string) => AssetService.delete(id), // Assuming AssetService.delete exists
        onSuccess: () => {
            toast.success("Asset deleted");
            refetchAll();
        },
        onError: () => toast.error("Failed to delete asset")
    });

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Asset Management</h1>
                    <p className="text-muted-foreground">Manage your physical assets, equipment, and LOTO procedures.</p>
                </div>
                <div className="flex gap-2">
                    <RoleGuard requiredPermission="asset:write">
                        <Button variant="outline" className="gap-2" onClick={() => setIsBulkImportOpen(true)}>
                            <Database className="w-4 h-4" /> Bulk Import
                        </Button>
                        <Button onClick={() => { setCreateParentId(null); setIsCreateModalOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> Add Asset
                        </Button>
                    </RoleGuard>
                </div>
            </header>

            <BulkImportModal
                isOpen={isBulkImportOpen}
                onClose={() => setIsBulkImportOpen(false)}
                onSuccess={handleSuccess}
            />

            {(!isAllLoading && (!allAssets || allAssets.length === 0)) ? (
                <AssetTemplatePicker onSuccess={handleSuccess} />
            ) : (
                <Tabs value={view} onValueChange={(v: string) => setView(v as "grid" | "tree" | "board")} className="w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <TabsList>
                            <TabsTrigger value="grid" className="gap-2">
                                <LayoutGrid className="h-4 w-4" /> Grid View
                            </TabsTrigger>
                            <TabsTrigger value="board" className="gap-2">
                                <Kanban className="h-4 w-4" /> Board View
                            </TabsTrigger>
                            <TabsTrigger value="tree" className="gap-2">
                                <Network className="h-4 w-4" /> Tree View
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-2 max-w-sm w-full">
                            <div className="relative w-full">
                                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rotate-45" />
                                <input
                                    type="text"
                                    placeholder="Search assets..."
                                    className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <TabsContent value="grid" className="mt-0">
                        {isAllLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />)}
                            </div>
                        ) : (
                            <AssetGrid
                                assets={filteredAssets}
                                onEdit={setEditAsset}
                            // [FIX] Pass Delete Handlers if AssetGrid supports it (it should)
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="board" className="mt-0">
                        {isAllLoading ? (
                            <p>Loading board...</p>
                        ) : (
                            <AssetGroupBoard
                                assets={filteredAssets}
                                onEdit={setEditAsset}
                                onDelete={(id) => {
                                    if (confirm("Are you sure you want to delete this asset?")) {
                                        deleteMutation.mutate(id);
                                    }
                                }}
                                onCreateGroup={() => {
                                    setCreateParentId(null);
                                    setEditAsset(null);
                                    setIsCreateModalOpen(true);
                                }}
                                onCreateChild={(parentId) => {
                                    setCreateParentId(parentId);
                                    setEditAsset(null);
                                    setIsCreateModalOpen(true);
                                }}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="tree" className="mt-0 space-y-4">
                        {/* [UX] Removed confusing "Root ID" input. Now auto-loads all assets. */}

                        {isAllLoading ? (
                            <p>Loading hierarchy...</p>
                        ) : (
                            <div className="h-[600px] bg-white rounded-xl border overflow-hidden">
                                <InteractiveTree
                                    assets={filteredAssets} // Pass filtered assets
                                    onNodeClick={(asset) => canEdit ? setEditAsset(asset) : null}
                                />
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}

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
                    parentId={createParentId}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}
