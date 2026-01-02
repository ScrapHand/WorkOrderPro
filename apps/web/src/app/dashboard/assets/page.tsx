"use client";
import { useQuery } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { AssetTree } from "@/components/assets/AssetTree";
import { AssetGrid } from "@/components/assets/AssetGrid"; // [NEW]
import { useState } from "react";
import { Search, LayoutGrid, Network, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CreateAssetModal } from "@/components/assets/CreateAssetModal";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/lib/auth/types";

export default function AssetsPage() {
    const { data: user } = useAuth();
    const [view, setView] = useState<"grid" | "tree">("grid");
    const [rootId, setRootId] = useState("41a408f1-64b1-49a2-b7c1-9f6a458bff78");
    const [inputVal, setInputVal] = useState(rootId);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data: allAssets, isLoading: isAllLoading, refetch: refetchAll } = useQuery({
        queryKey: ["assets"],
        queryFn: () => AssetService.getAll(),
    });

    const { data: treeAssets, isLoading: isTreeLoading, refetch: refetchTree } = useQuery({
        queryKey: ["assetTree", rootId],
        queryFn: () => AssetService.getTree(rootId),
        enabled: view === "tree" && !!rootId,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setRootId(inputVal);
    };

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
                            <Network className="h-4 w-4" /> Hierarchy Tree
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
                            isAdmin={user?.role === UserRole.ADMIN}
                        />
                    )}
                </TabsContent>

                <TabsContent value="tree" className="mt-0 space-y-4">
                    <div className="bg-white p-4 rounded-lg border shadow-sm max-w-md">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={inputVal}
                                onChange={(e) => setInputVal(e.target.value)}
                                placeholder="Enter Root Asset ID..."
                                className="flex-1 border rounded px-3 py-2 text-sm"
                            />
                            <Button type="submit" size="sm">
                                Load Tree
                            </Button>
                        </form>
                        <p className="text-xs text-gray-500 mt-2">
                            Try ID: 41a408f1-64b1-49a2-b7c1-9f6a458bff78 (Site A)
                        </p>
                    </div>

                    {isTreeLoading && <p>Loading hierarchy...</p>}
                    {treeAssets && (
                        <div className="max-w-3xl bg-white p-6 rounded-xl border">
                            <AssetTree assets={treeAssets} />
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <CreateAssetModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSuccess={() => {
                    refetchAll();
                    if (view === "tree") refetchTree();
                }}
            />
        </div>
    );
}
