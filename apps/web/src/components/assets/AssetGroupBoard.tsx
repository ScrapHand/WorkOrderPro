"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { Asset } from "@/types/asset";
import { useState, useMemo } from "react";
import { motion, Reorder } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, GripVertical } from "lucide-react";

interface AssetGroupBoardProps {
    assets: Asset[];
    onEdit: (asset: Asset) => void;
}

export function AssetGroupBoard({ assets, onEdit }: AssetGroupBoardProps) {
    const queryClient = useQueryClient();

    // 1. Identify "Groups" (Root Assets or Assets that act as containers)
    // For this implementation, we treat ANY Top-Level Asset (no parent) as a Group.
    // And we also include a "Unassigned" group for items with no parent (wait, roots ARE unassigned parents).
    // Let's adjust: "Groups" are Roots. Cards are *Children* of those Roots.
    // What about Assets that are children of children? We only show 2 levels deep for the board? 
    // Yes, a board is typically flat.

    // Derived State:
    // Columns = Assets with parentId === null.
    // Cards = Assets with parentId !== null.

    const groups = useMemo(() => {
        return assets
            .filter(a => !a.parentId)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [assets]);

    // Map of GroupId -> Children[]
    const groupChildren = useMemo(() => {
        const map: Record<string, Asset[]> = {};
        groups.forEach(g => {
            map[g.id] = assets.filter(a => a.parentId === g.id);
        });
        return map;
    }, [assets, groups]);

    const updateMutation = useMutation({
        mutationFn: ({ id, parentId }: { id: string, parentId: string }) =>
            AssetService.update(id, { parentId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            toast.success("Asset moved");
        },
        onError: () => toast.error("Failed to move asset")
    });

    // We use a simplified Drag and Drop here.
    // Since Framer Motion Reorder is for lists, and we want cross-list drag,
    // we might need a different approach or basic HTML5 DnD if Framer is complex for Grid.
    // Actually, simple HTML5 DnD is often more robust for Kanban than specialized libs if not using dnd-kit.
    // Let's use standard HTML5 DnD for simplicity and robustness without extra libs.

    const handleDragStart = (e: React.DragEvent, assetId: string) => {
        e.dataTransfer.setData("assetId", assetId);
    };

    const handleDrop = (e: React.DragEvent, targetGroupId: string) => {
        e.preventDefault();
        const assetId = e.dataTransfer.getData("assetId");
        if (!assetId) return;

        // Optimistic check?
        const asset = assets.find(a => a.id === assetId);
        if (asset && asset.parentId !== targetGroupId) {
            // Prevent dropping a Group into itself or weird cycles? 
            // Logic: If assetId is a Group (Root), we can't make it a child of another group easily in this view 
            // without removing it as a column.
            // Actually, if we drag a "Card" (Child), it's fine.
            // If we drag a "Group" (Root), it becomes a Child -> Disappears from Columns. That's valid.
            if (assetId === targetGroupId) return;

            updateMutation.mutate({ id: assetId, parentId: targetGroupId });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Allow drop
    };

    return (
        <div className="flex gap-6 overflow-x-auto pb-6 h-[calc(100vh-200px)] min-h-[500px]">
            {groups.map(group => (
                <div
                    key={group.id}
                    className="min-w-[300px] w-[300px] bg-muted/30 rounded-xl flex flex-col border border-border/50"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, group.id)}
                >
                    <div className="p-4 border-b bg-muted/40 rounded-t-xl flex justify-between items-center">
                        <div className="font-semibold truncate" title={group.name}>{group.name}</div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(group)}>
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </div>

                    <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                        {groupChildren[group.id]?.map(child => (
                            <motion.div
                                layoutId={child.id}
                                key={child.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e as any, child.id)}
                                className="cursor-grab active:cursor-grabbing"
                            >
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-3">
                                        <div className="font-medium text-sm">{child.name}</div>
                                        <div className="text-[10px] text-muted-foreground mt-1 flex justify-between">
                                            <span>{child.status}</span>
                                            {child.criticality && (
                                                <span className="font-bold">{child.criticality}</span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                        {(!groupChildren[group.id] || groupChildren[group.id].length === 0) && (
                            <div className="text-center text-xs text-muted-foreground py-8 border-2 border-dashed rounded-lg border-muted-foreground/20">
                                Drop assets here
                            </div>
                        )}
                    </div>
                    <div className="p-3 pt-0">
                        {/* Optional: Add Child Button */}
                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground dashed border border-transparent hover:border-border" disabled>
                            <Plus className="mr-2 h-3 w-3" /> Add Child (Todo)
                        </Button>
                    </div>
                </div>
            ))}

            {/* Create New Group Column */}
            <div className="min-w-[300px] flex items-center justify-center border-2 border-dashed rounded-xl opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                <div className="text-center">
                    <Plus className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-muted-foreground font-medium">Add Group</span>
                    <p className="text-xs text-muted-foreground/70 px-4 mt-2">Create a new top-level asset to act as a container.</p>
                </div>
            </div>
        </div>
    );
}
