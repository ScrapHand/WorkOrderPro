"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { Asset } from "@/types/asset";
import { useState, useMemo, useRef } from "react";
import { motion, Reorder } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, GripVertical } from "lucide-react";

interface AssetGroupBoardProps {
    assets: Asset[];
    onEdit?: (asset: Asset) => void;
    mode?: 'manage' | 'select';
    onSelect?: (asset: Asset) => void;
    onCreateGroup?: () => void;
    onCreateChild?: (parentId: string) => void;
}

export function AssetGroupBoard({ assets, onEdit, mode = 'manage', onSelect, onCreateGroup, onCreateChild }: AssetGroupBoardProps) {
    const queryClient = useQueryClient();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isDraggingBoard, setIsDraggingBoard] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // 1. Identify "Groups" (Root Assets or Assets that act as containers)
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

    // Drag-to-Scroll Handlers
    const handleBoardMouseDown = (e: React.MouseEvent) => {

        // Don't drag if clicking buttons or cards (handled by stopPropagation usually)
        if (!scrollContainerRef.current) return;
        setIsDraggingBoard(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
    };

    const handleBoardMouseLeave = () => {
        setIsDraggingBoard(false);
    };

    const handleBoardMouseUp = () => {
        setIsDraggingBoard(false);
    };

    const handleBoardMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingBoard || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast factor
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleDragStart = (e: React.DragEvent, assetId: string) => {
        if (mode === 'select') {
            e.preventDefault(); // Disable drag in select mode
            return;
        }
        e.dataTransfer.setData("assetId", assetId);
    };

    const handleDrop = (e: React.DragEvent, targetGroupId: string) => {
        if (mode === 'select') return;
        e.preventDefault();
        const assetId = e.dataTransfer.getData("assetId");
        if (!assetId) return;

        const asset = assets.find(a => a.id === assetId);
        if (asset && asset.parentId !== targetGroupId) {
            if (assetId === targetGroupId) return;
            updateMutation.mutate({ id: assetId, parentId: targetGroupId });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (mode === 'select') return;
        e.preventDefault();
    };

    return (
        <div
            ref={scrollContainerRef}
            className={`flex gap-6 overflow-x-auto pb-6 h-[calc(100vh-200px)] min-h-[500px] select-none ${isDraggingBoard ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleBoardMouseDown}
            onMouseLeave={handleBoardMouseLeave}
            onMouseUp={handleBoardMouseUp}
            onMouseMove={handleBoardMouseMove}
        >
            {groups.map(group => (
                <div
                    key={group.id}
                    className="min-w-[300px] w-[300px] bg-muted/30 rounded-xl flex flex-col border border-border/50 shrink-0"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, group.id)}
                    onMouseDown={e => e.stopPropagation()} // Stop drag-scroll when interacting with column
                >
                    <div className="p-4 border-b bg-muted/40 rounded-t-xl flex justify-between items-center group-header">
                        <div className="font-semibold truncate" title={group.name}>{group.name}</div>
                        {mode === 'manage' && onEdit && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(group)}>
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        )}
                        {mode === 'select' && (
                            <Button variant="ghost" size="sm" className="h-6 text-xs text-primary" onClick={() => onSelect?.(group)}>
                                Select Group
                            </Button>
                        )}
                    </div>

                    <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar" onMouseDown={e => e.stopPropagation()}>
                        {groupChildren[group.id]?.map(child => (
                            <motion.div
                                layoutId={child.id}
                                key={child.id}
                                draggable={mode === 'manage'}
                                onDragStart={(e) => handleDragStart(e as any, child.id)}
                                onClick={() => mode === 'select' && onSelect?.(child)}
                                className={`${mode === 'manage' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer hover:ring-2 hover:ring-primary'}`}
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
                                {mode === 'manage' ? 'Drop assets here' : 'No assets'}
                            </div>
                        )}
                    </div>
                    {mode === 'manage' && (
                        <div className="p-3 pt-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-muted-foreground dashed border border-transparent hover:border-border"
                                onClick={() => onCreateChild?.(group.id)}
                            >
                                <Plus className="mr-2 h-3 w-3" /> Add Child
                            </Button>
                        </div>
                    )}
                </div>
            ))}

            {/* Create New Group Column */}
            {mode === 'manage' && (
                <div
                    className="min-w-[300px] flex items-center justify-center border-2 border-dashed rounded-xl opacity-50 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                    onClick={() => onCreateGroup?.()}
                    onMouseDown={e => e.stopPropagation()}
                >
                    <div className="text-center">
                        <Plus className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">Add Group</span>
                        <p className="text-xs text-muted-foreground/70 px-4 mt-2">Create a new top-level asset to act as a container.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
