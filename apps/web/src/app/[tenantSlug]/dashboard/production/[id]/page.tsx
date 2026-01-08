"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductionLineService } from "@/services/production-line.service";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Zap, Info, Plus } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
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
            const isRestricted = bottlenecks.some((b: any) => b.connectionId === conn.id);
            return {
                id: conn.id,
                source: conn.sourceAssetId,
                target: conn.targetAssetId,
                label: conn.connectionType,
                animated: true,
                style: {
                    strokeWidth: isRestricted ? 4 : 2,
                    stroke: isRestricted ? '#ef4444' : '#6366f1'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: isRestricted ? '#ef4444' : '#6366f1'
                },
            };
        });
    }, [line.connections, bottlenecks]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Sync state when data changes
    useMemo(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
        >
            <Background color="#f1f5f9" gap={20} />
            <Controls />
            <Panel position="bottom-left" className="bg-white/80 backdrop-blur p-2 rounded-lg border text-[10px] uppercase font-bold tracking-wider text-muted-foreground shadow-sm">
                Production Flow Modeling Mode
            </Panel>
        </ReactFlow>
    );
}
