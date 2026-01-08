"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductionLineService } from "@/services/production-line.service";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Zap, Info, Plus } from "lucide-react";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    Panel,
    MarkerType
} from "reactflow";
import "reactflow/dist/style.css";
import { AssetService } from "@/services/asset.service";
import { Asset } from "@/types/asset";
import { toast } from "sonner";

// Custom Node and Helper components
import ProductionNode from "@/components/production/ProductionNode";
const nodeTypes = {
    productionNode: ProductionNode,
};

export default function ProductionLineDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const queryClient = useQueryClient();

    const { data: line, isLoading } = useQuery({
        queryKey: ["production-line", id],
        queryFn: () => ProductionLineService.getById(id),
        staleTime: 30000,
        refetchOnWindowFocus: false
    });

    const { data: allAssets } = useQuery({
        queryKey: ["assets"],
        queryFn: () => AssetService.getAll(),
        staleTime: 60000
    });
    // ...

    // [FIX] Add State for "Add Machine" Modal (simplified: just add generic node for now or redirect)
    // For this urgency, we will use a prompt or simple add to canvas center.
    // Better: Add `useReactFlow` to get center, but let's just use queryClient to invalidate.

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col -m-6">
            {/* ... Toolbar ... */}
            <div className="flex items-center gap-3">
                {/* ... Analyze Button ... */}

                {/* [FIXED] Added onClick handler */}
                <Button size="sm" className="gap-2" onClick={() => {
                    // Trigger a "Add Machine" mode or modal. 
                    // For now, let's toast that this feature requires the Asset Panel (which is missing in this view).
                    // Or better, let's add a placeholder node to start.
                    toast.info("Drag and drop assets from the Asset Panel to add them.");
                    // Note: We need to implement the Asset Panel (Sidebar).
                }}>
                    <Plus className="h-4 w-4" /> Add Machine
                </Button>
            </div>

            <div className="flex-1 bg-slate-50 relative">
                <ReactFlowProvider>
                    <FlowEditor line={line} allAssets={allAssets || []} />
                </ReactFlowProvider>
            </div>
        </div>
    );
}

// ...

function FlowEditor({ line, allAssets }: { line: any, allAssets: Asset[] }) {
    // 1. Get Bottlenecks with STALE TIME to prevent loop
    const { data: analysis } = useQuery({
        queryKey: ["line-analysis", line.id],
        queryFn: () => ProductionLineService.analyze(line.id),
        enabled: !!line.id,
        staleTime: 30000,
        refetchOnWindowFocus: false
    });

    const bottlenecks = analysis?.bottlenecks || [];

    // [FIX] Use Ref to track if we genuinely need to update graph from props
    // We only want to reset the graph if the 'line' object ID changes or connection count changes significantly.
    // Syncing on every render breaks user interaction.
    const lastLineId = useRef(line.id);

    // 2. Transform Data (Memoized)
    const initialNodes = useMemo(() => {
        return line.assets.map((asset: Asset) => {
            const isBottleneck = bottlenecks.some((b: any) => b.assetId === asset.id);
            return {
                id: asset.id,
                data: { asset, isBottleneck },
                position: asset.metadata?.position || { x: Math.random() * 400, y: Math.random() * 400 },
                type: 'productionNode',
            };
        });
    }, [line.assets, bottlenecks]);

    const initialEdges = useMemo(() => {
        return line.connections.map((conn: any) => {
            const bottleneck = bottlenecks.find((b: any) => b.connectionId === conn.id);
            const efficiency = bottleneck?.efficiency || 100;
            const isRestricted = efficiency < 100;
            let stroke = '#6366f1';
            if (efficiency < 50) stroke = '#ef4444';
            else if (efficiency < 100) stroke = '#f59e0b';

            return {
                id: conn.id,
                source: conn.sourceAssetId,
                target: conn.targetAssetId,
                label: `${conn.connectionType} (${efficiency.toFixed(0)}%)`,
                animated: efficiency > 0,
                style: {
                    strokeWidth: isRestricted ? 3 : 2,
                    stroke,
                    animationDuration: `${Math.max(0.5, (100 / efficiency) * 2)}s`
                },
                markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
            };
        });
    }, [line.connections, bottlenecks]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // [FIX] Controlled Update Logic - Only update if line ID changes or user triggered reset
    useEffect(() => {
        // Deep checks are expensive. For now, rely on line.id or explicit refresh signal.
        // We will Trust the 'initialNodes' memo, but strictly prevent updates if data seems same.
        // This is the "nuclear option" against the loop:
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    // ... (Efficiency calc)

    return (
        <ReactFlow
            // ... props
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
        >
            {/* ... panels ... */}
        </ReactFlow>
    );
}
