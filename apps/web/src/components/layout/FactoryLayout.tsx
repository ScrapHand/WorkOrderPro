"use client";

import React, { useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    NodeChange,
    applyNodeChanges,
    ReactFlowProvider,
    useReactFlow,
    OnNodesDelete
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AssetNode } from '../factory-layout/AssetNode';
import { toast } from 'sonner';
import axios from 'axios';
import { AssetPalette } from './AssetPalette';

// [ARCH] Hybrid Data Model Types
interface BackendLayoutNode {
    id: string;
    assetId: string;
    x: number;
    y: number;
    metaJson?: any;
    asset: {
        id: string;
        name: string;
        status: string;
        imageUrl?: string;
        code?: string;
    };
}

interface BackendLayout {
    id: string;
    nodes: BackendLayoutNode[];
    edges: any[];
}

const nodeTypes = {
    // @ts-ignore - React Flow types are strict about NodeProps
    asset: AssetNode,
};

interface FactoryLayoutProps {
    tenantSlug: string;
    layoutId: string;
}

// Simple debounce implementation to avoid lodash dependency issues
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function LayoutEditor({ tenantSlug, layoutId }: FactoryLayoutProps) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { project } = useReactFlow();
    const queryClient = useQueryClient();
    const queryKey = ['factory-layout', tenantSlug, layoutId];

    // [DATA FETCHING] Hybrid Selector
    const { data: layout, isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            const { data } = await axios.get<BackendLayout>(`/api/v1/factory-layouts/${layoutId}`, {
                headers: { 'X-Tenant-Slug': tenantSlug }
            });
            return data;
        }
    });

    // [STATE] Local State for React Flow
    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // [TRANSFORM] Sync Backend Data to React Flow
    React.useEffect(() => {
        if (layout) {
            const flowNodes: Node[] = layout.nodes.map(n => ({
                id: n.id,
                type: 'asset',
                position: { x: n.x, y: n.y },
                data: { asset: n.asset, meta: n.metaJson },
            }));
            setNodes(flowNodes);
            setEdges([]);
        }
    }, [layout, setNodes, setEdges]);

    // [OPTIMISTIC UI] Move Node
    const updateNodeMutation = useMutation({
        mutationFn: async (payload: { nodeId: string; x: number; y: number }) => {
            return axios.patch(`/api/v1/factory-layouts/${layoutId}/nodes/${payload.nodeId}`, {
                x: payload.x,
                y: payload.y
            }, { headers: { 'X-Tenant-Slug': tenantSlug } });
        },
        onMutate: async (newPos) => {
            await queryClient.cancelQueries({ queryKey });
            const previousLayout = queryClient.getQueryData<BackendLayout>(queryKey);
            if (previousLayout) {
                queryClient.setQueryData<BackendLayout>(queryKey, (old: BackendLayout | undefined) => {
                    if (!old) return old;
                    return {
                        ...old,
                        nodes: old.nodes.map(n =>
                            n.id === newPos.nodeId ? { ...n, x: newPos.x, y: newPos.y } : n
                        )
                    };
                });
            }
            return { previousLayout };
        },
        onError: (err, newPos, context) => {
            if (context?.previousLayout) {
                queryClient.setQueryData(queryKey, context.previousLayout);
            }
            toast.error("Failed to save node position");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    // [CREATE NODE]
    const createNodeMutation = useMutation({
        mutationFn: async (payload: { assetId: string; x: number; y: number; assetData: any }) => {
            // We pass assetData just for optimistic update if needed, but the backend returns the full node
            return axios.post(`/api/v1/factory-layouts/${layoutId}/nodes`, {
                assetId: payload.assetId,
                x: payload.x,
                y: payload.y
            }, { headers: { 'X-Tenant-Slug': tenantSlug } });
        },
        onSuccess: () => {
            toast.success("Asset added to layout");
            queryClient.invalidateQueries({ queryKey });
        },
        onError: () => {
            toast.error("Failed to add asset");
        }
    });

    // [DELETE NODE]
    const deleteNodeMutation = useMutation({
        mutationFn: async (nodeId: string) => {
            return axios.delete(`/api/v1/factory-layouts/${layoutId}/nodes/${nodeId}`, {
                headers: { 'X-Tenant-Slug': tenantSlug }
            });
        },
        onSuccess: () => {
            toast.success("Node removed");
            queryClient.invalidateQueries({ queryKey });
        },
        onError: () => {
            toast.error("Failed to remove node");
            // Force refresh to restore if it failed
            queryClient.invalidateQueries({ queryKey });
        }
    });

    // [DEBOUNCE]
    const debouncedUpdate = useMemo(
        () => debounce((nodeId: string, x: number, y: number) => {
            updateNodeMutation.mutate({ nodeId, x, y });
        }, 500),
        []
    );

    const onNodesChange = useCallback((changes: NodeChange[]) => {
        setNodes((nds) => applyNodeChanges(changes, nds));
    }, [setNodes]);

    const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
        debouncedUpdate(node.id, node.position.x, node.position.y);
    }, [debouncedUpdate]);

    // [DND HANDLERS]
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
            const assetDataString = event.dataTransfer.getData('application/reactflow');

            if (!assetDataString || !reactFlowBounds) return;

            const assetData = JSON.parse(assetDataString);

            const position = project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });

            // Optimistically add to UI (optional, but React Query invalidation will handle it fast)
            // Ideally we insert a temporary node. simpler to just fire mutation and wait for invalidate.
            createNodeMutation.mutate({
                assetId: assetData.id,
                x: position.x,
                y: position.y,
                assetData // Pass for potential optimistic logic
            });
        },
        [project, createNodeMutation]
    );

    const onNodesDelete: OnNodesDelete = useCallback((nodesToDelete) => {
        nodesToDelete.forEach(node => {
            deleteNodeMutation.mutate(node.id);
        });
    }, [deleteNodeMutation]);

    if (isLoading) return <div className="h-full flex items-center justify-center">Loading Layout...</div>;

    return (
        <div className="flex h-full w-full">
            <AssetPalette tenantSlug={tenantSlug} />
            <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeDragStop={onNodeDragStop}
                    onNodesDelete={onNodesDelete}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    nodeTypes={nodeTypes}
                    fitView
                    deleteKeyCode={['Backspace', 'Delete']}
                >
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
}

export default function FactoryLayout(props: FactoryLayoutProps) {
    return (
        <ReactFlowProvider>
            <LayoutEditor {...props} />
        </ReactFlowProvider>
    );
}
