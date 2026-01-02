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
    Panel,
    useReactFlow
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
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

    // Toggle Collapse Handler
    const onToggleCollapse = useCallback((nodeId: string) => {
        setCollapsedIds((prev) => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    }, []);

    // Helper to find all descendants of a node
    // Memoized set of hidden nodes based on collapsed parents
    const hiddenNodes = useMemo(() => {
        const hidden = new Set<string>();
        const childrenMap = new Map<string, string[]>();

        // Build adjacency list
        assets.forEach(a => {
            if (a.parentId) {
                if (!childrenMap.has(a.parentId)) childrenMap.set(a.parentId, []);
                childrenMap.get(a.parentId)?.push(a.id);
            }
        });

        // Traverse from collapsed nodes
        const traverse = (parentId: string) => {
            const children = childrenMap.get(parentId) || [];
            children.forEach(childId => {
                hidden.add(childId);
                traverse(childId); // Recursive hide
            });
        };

        collapsedIds.forEach(id => traverse(id));
        return hidden;
    }, [assets, collapsedIds]);

    // 1. Transform Data
    const { initialNodes, initialEdges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        // Map allows quick lookup to check if node has children
        const parentMap = new Set(assets.map(a => a.parentId).filter(Boolean));

        assets.forEach((asset) => {
            const isHidden = hiddenNodes.has(asset.id);
            if (isHidden) return; // Don't render hidden nodes

            const savedPos = asset.metadata?.position || { x: 0, y: 0 };
            const hasChildren = assets.some(a => a.parentId === asset.id);

            nodes.push({
                id: asset.id,
                type: 'assetNode',
                data: {
                    asset,
                    onEdit: onNodeClick,
                    isCollapsed: collapsedIds.has(asset.id),
                    hasChildren: hasChildren,
                    onToggle: () => onToggleCollapse(asset.id)
                },
                position: savedPos,
            });

            if (asset.parentId && !hiddenNodes.has(asset.parentId)) {
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
    }, [assets, onNodeClick, hiddenNodes, collapsedIds, onToggleCollapse]);

    // Update Nodes/Edges when asset list or collapsed state changes
    // We use useEffect to sync the internal ReactFlow state
    const { setNodes, setEdges } = useReactFlow(); // Needs to be inside provider, but we are inside LayoutFlow

    // FIX: useNodesState matches initial state, but we need to update it when 'initialNodes' recalculates.
    // However, setNodes from useNodesState is local.
    // Let's rely on the auto-layout or direct prop passing if controlled.
    // Actually, simply passing 'nodes={initialNodes}' to ReactFlow makes it controlled?
    // No, ReactFlow is uncontrolled by default unless onNodesChange is wired to a state that updates.

    // Let's force update the local state when computed nodes change
    const [nodes, setNodesState, onNodesChange] = useNodesState([]);
    const [edges, setEdgesState, onEdgesChange] = useEdgesState([]);

    // Sync computed nodes to local state
    // Use deep comparison or simple length check to avoid loops?
    // Actually simplicity: Just set them.
    useMemo(() => {
        setNodesState(initialNodes);
        setEdgesState(initialEdges);
    }, [initialNodes, initialEdges, setNodesState, setEdgesState]);

    // ... (Auto Layout logic remains similar, but trigger needs check)

    // 3. Auto Layout
    const hasSavedPositions = useMemo(() => {
        return assets.some(a => a.metadata?.position);
    }, [assets]);

    // Only run layout if we have nodes and NOT using saved positions (or forced)
    // For collapsing, we might want to re-run layout?
    // User wants "interactive hierarchy tree... with ability to collapse".
    // If we hide nodes, the tree should probably shrink.
    // useAutoLayout runs on 'nodes' change.

    useAutoLayout(nodes, edges);

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
