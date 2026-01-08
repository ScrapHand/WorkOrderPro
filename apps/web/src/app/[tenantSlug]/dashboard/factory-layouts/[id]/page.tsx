"use client";

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Node,
    Edge,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { AssetNode } from '@/components/factory-layout/AssetNode';
import { ConveyorEdge } from '@/components/factory-layout/ConveyorEdge';
import { LayoutToolbar } from '@/components/factory-layout/LayoutToolbar';
import { AssetSidebar } from '@/components/factory-layout/AssetSidebar';
import { ConveyorSystemPanel } from '@/components/factory-layout/ConveyorSystemPanel';
import { NodeContextMenu } from '@/components/factory-layout/NodeContextMenu';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Network } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useUser } from '@/hooks/use-auth';
import { UserRole } from '@/lib/auth/types';
import { useAutoSave } from '@/hooks/use-auto-save';
import { formatDistanceToNow } from 'date-fns';

// Type definitions for React Flow data
interface AssetNodeData extends Record<string, unknown> {
    asset: {
        id: string;
        name: string;
        status: string;
        imageUrl?: string;
    };
}

interface ConveyorEdgeData extends Record<string, unknown> {
    systemColor?: string;
    label?: string;
    type?: string;
    conveyorSystemId?: string | null;
}

const nodeTypes = {
    assetNode: AssetNode,
} as any;

const edgeTypes = {
    conveyorEdge: ConveyorEdge,
} as any;

let nodeId = 0;

export default function FactoryLayoutEditorPage() {
    const params = useParams();
    const router = useRouter();
    const layoutId = params.id as string;
    const tenantSlug = (params.tenantSlug as string) || 'default';
    const queryClient = useQueryClient();
    const { fitView, zoomIn, zoomOut, screenToFlowPosition } = useReactFlow();
    const { data: user } = useUser();

    const [nodes, setNodes, onNodesChange] = useNodesState<Node<AssetNodeData>>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<ConveyorEdgeData>>([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showSystemPanel, setShowSystemPanel] = useState(false);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
    const [contextMenu, setContextMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);

    const canEdit = user?.role === UserRole.ADMIN;

    // Fetch layout data
    const { data: layout, isLoading } = useQuery({
        queryKey: ['layout', layoutId],
        queryFn: async () => {
            const res = await fetch(`/api/v1/factory-layouts/${layoutId}`, {
                credentials: 'include'
            });
            if (!res.ok) {
                if (res.status === 404) {
                    router.push(`/${tenantSlug}/dashboard/factory-layouts`);
                    throw new Error('Layout not found');
                }
                throw new Error('Failed to fetch layout');
            }
            return res.json();
        },
    });

    // Transform backend data to React Flow format
    useEffect(() => {
        if (!layout) return;

        const initialNodes: Node<AssetNodeData>[] = layout.nodes?.map((node: any) => ({
            id: node.id,
            type: 'assetNode',
            position: { x: node.x, y: node.y },
            data: { asset: node.asset },
        })) || [];

        const initialEdges: Edge<ConveyorEdgeData>[] = layout.edges?.map((edge: any) => ({
            id: edge.id,
            source: edge.sourceNodeId,
            target: edge.targetNodeId,
            type: 'conveyorEdge',
            data: {
                systemColor: edge.conveyorSystem?.color,
                label: edge.label,
                type: edge.type,
            },
        })) || [];

        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [layout, setNodes, setEdges]);

    // Handle new connections
    const onConnect = useCallback(
        (connection: Connection) => {
            if (layout?.isLocked) {
                toast.error('Cannot modify locked layout');
                return;
            }
            setEdges((eds) => addEdge({
                ...connection,
                type: 'conveyorEdge',
                data: { type: 'CONVEYOR' }
            }, eds));
        },
        [setEdges, layout]
    );

    // Handle drag and drop from sidebar
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            if (layout?.isLocked) {
                toast.error('Cannot modify locked layout');
                return;
            }

            const data = event.dataTransfer.getData('application/reactflow');
            if (!data) return;

            const { type, data: nodeData } = JSON.parse(data);
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node<AssetNodeData> = {
                id: `node_${nodeId++}_${Date.now()}`,
                type,
                position,
                data: nodeData,
            };

            setNodes((nds) => nds.concat(newNode));
            toast.success(`Added ${nodeData.asset.name} to layout`);
        },
        [screenToFlowPosition, setNodes, layout]
    );

    // Handle edge selection
    const onSelectionChange = useCallback(({ edges: selectedEdges }: any) => {
        setSelectedEdge(selectedEdges.length === 1 ? selectedEdges[0] : null);
    }, []);

    // Assign edge to conveyor system
    const handleAssignSystem = useCallback((systemId: string | null) => {
        if (!selectedEdge) return;

        setEdges((eds) =>
            eds.map((edge) =>
                edge.id === selectedEdge.id
                    ? {
                        ...edge,
                        data: {
                            ...edge.data,
                            conveyorSystemId: systemId,
                            // Update color based on system (would need to fetch system details)
                        },
                    }
                    : edge
            )
        );
        toast.success(systemId ? 'Edge assigned to system' : 'System assignment cleared');
    }, [selectedEdge, setEdges]);

    // Context menu handlers
    const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
        event.preventDefault();
        if (!canEdit || layout?.isLocked) return;

        setContextMenu({
            nodeId: node.id,
            x: event.clientX,
            y: event.clientY,
        });
    }, [canEdit, layout]);

    const handleDeleteNode = useCallback(() => {
        if (!contextMenu) return;
        setNodes((nds) => nds.filter((n) => n.id !== contextMenu.nodeId));
        toast.success('Node deleted');
    }, [contextMenu, setNodes]);

    const handleDuplicateNode = useCallback(() => {
        if (!contextMenu) return;
        const nodeToDuplicate = nodes.find((n) => n.id === contextMenu.nodeId);
        if (!nodeToDuplicate) return;

        const newNode: Node<AssetNodeData> = {
            ...nodeToDuplicate,
            id: `node_${nodeId++}_${Date.now()}`,
            position: {
                x: nodeToDuplicate.position.x + 50,
                y: nodeToDuplicate.position.y + 50,
            },
        };

        setNodes((nds) => [...nds, newNode]);
        toast.success('Node duplicated');
    }, [contextMenu, nodes, setNodes]);

    // Save graph mutation
    const saveMutation = useMutation({
        mutationFn: async () => {
            const graphData = {
                version: layout.version,
                nodes: nodes.map(node => ({
                    id: node.id,
                    assetId: node.data.asset.id,
                    x: node.position.x,
                    y: node.position.y,
                })),
                edges: edges.map(edge => ({
                    id: edge.id,
                    sourceNodeId: edge.source,
                    targetNodeId: edge.target,
                    type: edge.data?.type || 'CONVEYOR',
                    label: edge.data?.label,
                })),
            };

            const res = await fetch(`/api/v1/factory-layouts/${layoutId}/graph`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(graphData),
            });

            if (!res.ok) {
                if (res.status === 409) {
                    throw new Error('Layout has been modified by another user. Please refresh.');
                }
                throw new Error('Failed to save layout');
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['layout', layoutId], data);
            toast.success('Layout saved successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Toggle lock mutation
    const toggleLockMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/v1/factory-layouts/${layoutId}/lock`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to toggle lock');
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['layout', layoutId], data);
            toast.success(data.isLocked ? 'Layout locked' : 'Layout unlocked');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Auto-save hook
    const graphData = { nodes, edges, version: layout?.version };
    const { isSaving: isAutoSaving, lastSaved } = useAutoSave(graphData, {
        delay: 3000,
        enabled: canEdit && !layout?.isLocked,
        onSave: async () => {
            if (!layout || nodes.length === 0) return;
            await saveMutation.mutateAsync();
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-muted-foreground">Loading layout...</div>
            </div>
        );
    }

    if (!layout) {
        return null;
    }

    const isLocked = layout.isLocked;
    const isReadOnly = !canEdit || isLocked;

    return (
        <div className="fixed inset-0 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center z-20">
                <div className="flex items-center gap-4">
                    <Link href={`/${tenantSlug}/dashboard/factory-layouts`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">{layout.name}</h1>
                        <div className="flex items-center gap-3">
                            {layout.description && (
                                <p className="text-sm text-muted-foreground">{layout.description}</p>
                            )}
                            {lastSaved && (
                                <span className="text-xs text-muted-foreground">
                                    {isAutoSaving ? '💾 Saving...' : `✓ Saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {canEdit && !isLocked && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSidebar(!showSidebar)}
                                className="gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                {showSidebar ? 'Hide' : 'Add'} Assets
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSystemPanel(!showSystemPanel)}
                                className="gap-2"
                            >
                                <Network className="w-4 h-4" />
                                {showSystemPanel ? 'Hide' : 'Conveyor'} Systems
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* React Flow Canvas */}
            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={isReadOnly ? undefined : onNodesChange}
                    onEdgesChange={isReadOnly ? undefined : onEdgesChange}
                    onConnect={isReadOnly ? undefined : onConnect}
                    onDrop={isReadOnly ? undefined : onDrop}
                    onDragOver={isReadOnly ? undefined : onDragOver}
                    onSelectionChange={onSelectionChange}
                    onNodeContextMenu={isReadOnly ? undefined : onNodeContextMenu}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    nodesDraggable={!isReadOnly}
                    nodesConnectable={!isReadOnly}
                    elementsSelectable={true}
                    snapToGrid
                    snapGrid={[15, 15]}
                >
                    <Background />
                    <Controls />
                    <MiniMap
                        nodeColor={(node: any) => {
                            const status = node.data?.asset?.status;
                            switch (status) {
                                case 'OPERATIONAL':
                                    return '#10b981';
                                case 'DOWN':
                                    return '#ef4444';
                                case 'MAINTENANCE':
                                    return '#f59e0b';
                                default:
                                    return '#9ca3af';
                            }
                        }}
                        maskColor="rgb(240, 240, 240, 0.8)"
                        position="bottom-left"
                    />
                </ReactFlow>

                {/* Asset Sidebar */}
                {showSidebar && canEdit && !isLocked && (
                    <AssetSidebar
                        onClose={() => setShowSidebar(false)}
                        existingAssetIds={nodes.map((n) => n.data.asset.id)}
                    />
                )}

                {/* Conveyor System Panel */}
                {showSystemPanel && canEdit && !isLocked && (
                    <ConveyorSystemPanel
                        onClose={() => setShowSystemPanel(false)}
                        selectedEdgeId={selectedEdge?.id}
                        onAssignToEdge={handleAssignSystem}
                    />
                )}

                {/* Node Context Menu */}
                {contextMenu && (
                    <NodeContextMenu
                        nodeId={contextMenu.nodeId}
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onClose={() => setContextMenu(null)}
                        onDelete={handleDeleteNode}
                        onDuplicate={handleDuplicateNode}
                    />
                )}

                {/* Toolbar */}
                <LayoutToolbar
                    isLocked={isLocked}
                    isSaving={saveMutation.isPending}
                    onToggleLock={() => toggleLockMutation.mutate()}
                    onSave={() => saveMutation.mutate()}
                    onZoomIn={() => zoomIn()}
                    onZoomOut={() => zoomOut()}
                    onFitView={() => fitView()}
                    canEdit={canEdit}
                />
            </div>

            {/* Read-only notice */}
            {!canEdit && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg shadow-md">
                    Read-only: Only admins can edit layouts
                </div>
            )}
        </div>
    );
}
