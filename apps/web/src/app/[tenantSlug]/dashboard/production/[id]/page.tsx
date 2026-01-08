"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductionLineService } from "@/services/production-line.service";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Zap, Info, Plus } from "lucide-react";
import { useState, useCallback, useMemo, useEffect } from "react";
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

// Custom Node and Helper components would go here or be imported
// For now, let's build the Page structure

export default function ProductionLineDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const queryClient = useQueryClient();

    const { data: line, isLoading } = useQuery({
        queryKey: ["production-line", id],
        queryFn: () => ProductionLineService.getById(id)
    });

    const { data: allAssets } = useQuery({
        queryKey: ["assets"],
        queryFn: () => AssetService.getAll()
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

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col -m-6">
            {/* Toolbar */}
            <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{line?.name}</h1>
                        <p className="text-xs text-muted-foreground">Flow Model & Optimization</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => analysisMutation.mutate()} disabled={analysisMutation.isPending}>
                        <Zap className={`h-4 w-4 ${analysisMutation.isPending ? 'animate-pulse text-yellow-500' : 'text-orange-500'}`} />
                        {analysisMutation.isPending ? 'Analyzing...' : 'Analyze Flow'}
                    </Button>
                    <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> Add Machine
                    </Button>
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

import ProductionNode from "@/components/production/ProductionNode";

const nodeTypes = {
    productionNode: ProductionNode,
};

function FlowEditor({ line, allAssets }: { line: any, allAssets: Asset[] }) {
    // 1. Get Bottlenecks from analysis (if any)
    const { data: analysis } = useQuery({
        queryKey: ["line-analysis", line.id],
        queryFn: () => ProductionLineService.analyze(line.id),
        enabled: !!line.id
    });

    const bottlenecks = analysis?.bottlenecks || [];

    // 2. Transform Data
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

            // Calculate stroke color based on efficiency
            let stroke = '#6366f1'; // Default Indigo
            if (efficiency < 50) stroke = '#ef4444'; // Red
            else if (efficiency < 100) stroke = '#f59e0b'; // Amber

            return {
                id: conn.id,
                source: conn.sourceAssetId,
                target: conn.targetAssetId,
                label: `${conn.connectionType} (${efficiency.toFixed(0)}%)`,
                animated: efficiency > 0,
                style: {
                    strokeWidth: isRestricted ? 3 : 2,
                    stroke,
                    // Speed animation based on efficiency
                    animationDuration: `${Math.max(0.5, (100 / efficiency) * 2)}s`
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: stroke
                },
            };
        });
    }, [line.connections, bottlenecks]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Sync state when data changes
    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    const systemEfficiency = useMemo(() => {
        if (line.connections.length === 0) return 100;
        const totalEff = line.connections.reduce((acc: number, conn: any) => {
            const b = bottlenecks.find((bn: any) => bn.connectionId === conn.id);
            return acc + (b?.efficiency || 100);
        }, 0);
        return totalEff / line.connections.length;
    }, [line.connections, bottlenecks]);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
        >
            <Background color="#cbd5e1" gap={20} size={1} />
            <Controls />
            <Panel position="top-right" className="bg-white/90 backdrop-blur p-4 rounded-xl border-2 shadow-xl flex gap-6">
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
            </Panel>
            <Panel position="bottom-left" className="bg-black/80 text-white p-2 px-3 rounded-full text-[10px] uppercase font-bold tracking-widest shadow-2xl">
                Factory Floor Engine v1.2
            </Panel>
        </ReactFlow>
    );
}
