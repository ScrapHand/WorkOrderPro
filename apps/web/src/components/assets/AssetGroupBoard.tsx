"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { Asset } from "@/types/asset";
import { useState, useMemo, useRef } from "react";
import { motion, Reorder } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, GripVertical, ArrowLeft, Home, FolderOpen } from "lucide-react";

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

    // Drill-down State
    const [currentRootId, setCurrentRootId] = useState<string | null>(null);

    const currentRoot = useMemo(() =>
        currentRootId ? assets.find(a => a.id === currentRootId) : null
        , [assets, currentRootId]);

    // 1. Identify "Groups" (Columns) based on current Root
    const groups = useMemo(() => {
        return assets
            .filter(a => a.parentId === currentRootId)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [assets, currentRootId]);

    // Map of GroupId -> Children[] (Cards)
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

    const handleNavigateUp = () => {
        if (!currentRoot) return;
        setCurrentRootId(currentRoot.parentId);
    };

    const handleDrillDown = (asset: Asset) => {
        setCurrentRootId(asset.id);
    };

    // Drag-to-Scroll Handlers
    const handleBoardMouseDown = (e: React.MouseEvent) => {
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
            e.preventDefault();
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
        <div className="space-y-4">
            {/* Navigation Header */}
            <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg">
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={!currentRootId}
                    onClick={handleNavigateUp}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" /> Up Level
                </Button>
                <div className="flex-1 font-mono text-sm px-2 text-muted-foreground flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span className="text-gray-400">/</span>
                    <span className={!currentRoot ? "font-bold text-foreground" : ""}>Root</span>
                    {currentRoot && (
                        <>
                            <span className="text-gray-400">/</span>
                            <span className="font-bold text-foreground">{currentRoot.name}</span>
                        </>
                    )}
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className={`flex gap-6 overflow-x-auto pb-6 h-[calc(100vh-250px)] min-h-[500px] select-none ${isDraggingBoard ? 'cursor-grabbing' : 'cursor-grab'}`}
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
                    >
                        <div className="p-4 border-b bg-muted/40 rounded-t-xl flex justify-between items-center group-header">
                            <div className="flex items-center gap-2 truncate">
                                <div className="font-semibold truncate max-w-[120px]" title={group.name}>{group.name}</div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                                    title="Open Group"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDrillDown(group);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <FolderOpen className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center">
                                {mode === 'manage' && onEdit && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => onEdit(group)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                )}
                                {mode === 'select' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-primary ml-1"
                                        onClick={() => onSelect?.(group)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        Select
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                            {groupChildren[group.id]?.map(child => (
                                <motion.div
                                    layoutId={child.id}
                                    key={child.id}
                                    draggable={mode === 'manage'}
                                    onDragStart={(e) => handleDragStart(e as any, child.id)}
                                    // Handle Double Click for Drill Down
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        handleDrillDown(child);
                                    }}
                                    onClick={() => mode === 'select' ? onSelect?.(child) : null}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className={`${mode === 'manage' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer hover:ring-2 hover:ring-primary'}`}
                                >
                                    <Card className="hover:shadow-md transition-all hover:border-primary/50 group relative overflow-hidden">
                                        {child.imageUrl && (
                                            <div className="h-24 w-full overflow-hidden bg-muted">
                                                <img src={child.imageUrl} alt={child.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                            </div>
                                        )}
                                        <div className={`absolute top-0 left-0 w-1 h-full 
                                            ${child.criticality === 'A' ? 'bg-red-500' :
                                                child.criticality === 'B' ? 'bg-orange-500' : 'bg-blue-500'}`}
                                        />
                                        <CardContent className="p-3 pl-4">
                                            <div className="flex justify-between items-start">
                                                <div className="font-medium text-sm truncate flex-1" title={child.name}>{child.name}</div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 -mt-1 -mr-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Drill Down"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDrillDown(child);
                                                    }}
                                                >
                                                    <FolderOpen className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            <div className="flex items-center gap-2 mt-2">
                                                <div className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border
                                                    ${child.status === 'OPERATIONAL' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        child.status === 'DOWN' ? 'bg-red-50 text-red-700 border-red-200' :
                                                            'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                    {child.status}
                                                </div>
                                                {child.criticality && (
                                                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border
                                                        ${child.criticality === 'A' ? 'bg-red-100 text-red-800 border-red-200' :
                                                            child.criticality === 'B' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                                                'bg-blue-100 text-blue-800 border-blue-200'}`}>
                                                        {child.criticality}
                                                    </div>
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
                                    onMouseDown={(e) => e.stopPropagation()}
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
                            <p className="text-xs text-muted-foreground/70 px-4 mt-2">Create a new container in {currentRoot ? currentRoot.name : 'Root'}.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
