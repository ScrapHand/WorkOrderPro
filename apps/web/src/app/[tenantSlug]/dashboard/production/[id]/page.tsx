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

    const { data: line, isLoading, isError } = useQuery({
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

    const analysisMutation = useMutation({
        mutationFn: () => ProductionLineService.analyze(id),
        onSuccess: (data) => {
            if (data.bottlenecks.length > 0) {
                toast.warning(`Found ${data.bottlenecks.length} bottlenecks!`, {
                    description: data.bottlenecks[0].message
                });
            } else {
                toast.success("Line analysis complete: No major bottlenecks detected.");
            }
        }
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading production flow...</div>;
    if (isError || !line) return <div className="p-8 text-center text-red-500">Error: Could not load production line.</div>;

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col -m-6">
            {/* Toolbar */}
            <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{line.name}</h1>
                        <p className="text-xs text-muted-foreground">Flow Model & Optimization</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => analysisMutation.mutate()} disabled={analysisMutation.isPending}>
                        <Zap className={`h-4 w-4 ${analysisMutation.isPending ? 'animate-pulse text-yellow-500' : 'text-orange-500'}`} />
                        {analysisMutation.isPending ? 'Analyzing...' : 'Analyze Flow'}
                    </Button>
                    {/* Moved Add Machine Button into FlowEditor for state access */}
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-slate-50 relative">
                <ReactFlowProvider>
                    <FlowEditor line={line} allAssets={allAssets || []} />
                </ReactFlowProvider>
            </div>
        </div>
    );
}

function FlowEditor({ line, allAssets }: { line: any, allAssets: Asset[] }) {
    // 1. Get Bottlenecks with STALE TIME to prevent loop
    const { data: analysis } = useQuery({
        queryKey: ["line-analysis", line?.id],
        queryFn: () => ProductionLineService.analyze(line.id),
        enabled: !!line?.id,
        staleTime: 30000,
        refetchOnWindowFocus: false
    });

    const bottlenecks = analysis?.bottlenecks || [];

    // [FIX] Use Ref to track if we genuinely need to update graph from props
    // We only want to reset the graph if the 'line' object ID changes or connection count changes significantly.
    // Syncing on every render breaks user interaction.
    const lastLineId = useRef(line?.id);

    // 2. Transform Data (Memoized)
    const initialNodes = useMemo(() => {
        if (!line?.assets) return [];
        return line.assets.map((asset: Asset) => {
            const isBottleneck = bottlenecks.some((b: any) => b.assetId === asset.id);
            return {
                id: asset.id,
                data: { asset, isBottleneck },
                position: asset.metadata?.position || { x: Math.random() * 400, y: Math.random() * 400 },
                type: 'productionNode',
            };
        });
    }, [line?.assets, bottlenecks]);

    const initialEdges = useMemo(() => {
        if (!line?.connections) return [];
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
    }, [line?.connections, bottlenecks]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // [FIX] Controlled Update Logic - Only update if line ID changes or user triggered reset
    // We only want to reset the graph if the 'line' object ID changes or connection count changes significantly.
    // Syncing on every render breaks user interaction.
    useEffect(() => {
        if (line?.id !== lastLineId.current) {
            setNodes(initialNodes);
            setEdges(initialEdges);
            lastLineId.current = line?.id;
        }
    }, [initialNodes, initialEdges, line?.id, setNodes, setEdges]);

    const handleAddMachine = () => {
        // Simple mock implementation for now: Add the first available asset or random one
        // In real app: Open a Dialog with Asset Selector
        if (allAssets.length === 0) {
            toast.error("No assets available in registry.");
            return;
        }
        const randomAsset = allAssets[Math.floor(Math.random() * allAssets.length)];
        const newNode = {
            id: randomAsset.id + '-' + Date.now(), // Temporary ID logic
            data: { asset: randomAsset, isBottleneck: false },
            position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
            type: 'productionNode'
        };
        setNodes((nds) => nds.concat(newNode));
        toast.success(`Added ${randomAsset.name} to canvas`);
    };

    const systemEfficiency = useMemo(() => {
        if (!line?.connections || line.connections.length === 0) return 100;
        const totalEff = line.connections.reduce((acc: number, conn: any) => {
            const b = bottlenecks.find((bn: any) => bn.connectionId === conn.id);
            return acc + (b?.efficiency || 100);
        }, 0);
        return totalEff / line.connections.length;
    }, [line?.connections, bottlenecks]);

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
            <Background color="#cbd5e1" gap={20} size={1} />
            <Controls />
            <Panel position="top-right" className="flex gap-4 items-start">
                <div className="bg-white/90 backdrop-blur p-4 rounded-xl border-2 shadow-xl flex gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">System Efficiency</span>
                        <span className={`text-2xl font-black ${systemEfficiency > 90 ? 'text-green-600' : systemEfficiency > 60 ? 'text-orange-600' : 'text-red-600'}`}>
                            {systemEfficiency.toFixed(1)}%
                        </span>
                    </div>
                    <div className="w-px bg-slate-200" />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Active Bottlenecks</span>
                        <span className={`text-2xl font-black ${bottlenecks.length === 0 ? 'text-slate-400' : 'text-red-600'}`}>
                            {bottlenecks.length}
                        </span>
                    </div>
                </div>
                <Button onClick={handleAddMachine} className="shadow-xl" size="lg">
                    <Plus className="mr-2 h-4 w-4" /> Add Machine
                </Button>
            </Panel>
            <Panel position="bottom-left" className="bg-black/80 text-white p-2 px-3 rounded-full text-[10px] uppercase font-bold tracking-widest shadow-2xl">
                Factory Floor Engine v1.2
            </Panel>
        </ReactFlow>
    );
}
