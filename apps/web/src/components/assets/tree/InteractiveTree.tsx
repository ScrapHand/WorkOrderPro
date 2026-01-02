"use client";
import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    ReactFlowProvider,
    MiniMap,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Asset } from "@/types/asset";
import AssetNode from './AssetNode';
import { useAutoLayout } from './useAutoLayout';
import { Button } from "@/components/ui/button";
import { Lock, Save } from "lucide-react";
import { AssetService } from '@/services/asset.service';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/lib/auth/types';

// Node Types Registration
const nodeTypes = {
    assetNode: AssetNode,
};

interface InteractiveTreeProps {
    assets: Asset[];
    onNodeClick?: (asset: Asset) => void;
}

const LayoutFlow = ({ assets, onNodeClick }: InteractiveTreeProps) => {
    const { data: user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    // 1. Transform Data
    const { initialNodes, initialEdges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        assets.forEach((asset) => {
            // Priority: User's saved pos > Global saved pos > Auto-layout (0,0)
            // Note: Currently we only receive 'assets' which might include 'metadata' from DB.
            // If we implement user prefs, we might need to merge that in 'assets' or pass separately.
            // For now, let's look at asset.metadata.position

            const savedPos = asset.metadata?.position || { x: 0, y: 0 };

            nodes.push({
                id: asset.id,
                type: 'assetNode',
                data: { asset, onEdit: onNodeClick },
                position: savedPos,
            });

            if (asset.parentId) {
                edges.push({
                    id: `e-${asset.parentId}-${asset.id}`,
                    source: asset.parentId,
                    target: asset.id,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#b1b1b7' },
                });
            }
        });

        return { initialNodes: nodes, initialEdges: edges };
    }, [assets, onNodeClick]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // 3. Auto Layout
    // Only run if NO nodes have saved positions (first time load)
    const hasSavedPositions = useMemo(() => {
        return assets.some(a => a.metadata?.position);
    }, [assets]);

    useAutoLayout(initialNodes, initialEdges); // We might want to make this conditional on !hasSavedPositions in useAutoLayout itself

    const onSaveLayout = async () => {
        setIsSaving(true);
        try {
            const layout: Record<string, { x: number, y: number }> = {};
            nodes.forEach((node: Node) => {
                layout[node.id] = { x: node.position.x, y: node.position.y };
            });

            const scope = user?.role === UserRole.ADMIN ? 'global' : 'user';

            await AssetService.saveLayout(layout, scope);
            toast.success(`Layout saved (${scope === 'global' ? 'Company Default' : 'Personal'})`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to save layout");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-[600px] w-full border rounded-xl overflow-hidden bg-slate-50 relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.2}
            >
                <Background color="#ccc" gap={20} />
                <Controls />
                <MiniMap nodeColor="#e2e8f0" />
                <Panel position="top-right" className="bg-white p-2 rounded shadow border flex gap-2">
                    <Button size="sm" variant="outline" onClick={onSaveLayout} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Lock Layout"}
                    </Button>
                </Panel>
            </ReactFlow>
        </div>
    );
};

export function InteractiveTree(props: InteractiveTreeProps) {
    return (
        <ReactFlowProvider>
            <LayoutFlow {...props} />
        </ReactFlowProvider>
    );
}
