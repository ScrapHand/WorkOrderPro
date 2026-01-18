import { PrismaClient } from '@prisma/client';

export interface CreateLayoutDto {
    name: string;
    description?: string;
}

export interface UpdateLayoutMetadataDto {
    name?: string;
    description?: string;
    viewportJson?: any;
}

export interface BulkSaveGraphDto {
    version: number;
    nodes: {
        id?: string;
        assetId: string;
        x: number;
        y: number;
        width?: number;
        height?: number;
        rotation?: number;
        metaJson?: any;
    }[];
    edges: {
        id?: string;
        sourceNodeId: string;
        targetNodeId: string;
        type: 'CONVEYOR' | 'MODULE';
        conveyorSystemId?: string;
        label?: string;
        metaJson?: any;
    }[];
}

export class FactoryLayoutService {
    constructor(private prisma: PrismaClient) { }

    /**
     * Create a new factory layout
     * @param tenantId - Tenant ID from session
     * @param dto - Layout creation data
     */
    async createLayout(tenantId: string, dto: CreateLayoutDto) {
        return this.prisma.factoryLayout.create({
            data: {
                tenantId,
                name: dto.name,
                description: dto.description
            }
        });
    }

    /**
     * Get all layouts for a tenant
     * @param tenantId - Tenant ID from session
     */
    async getLayouts(tenantId: string) {
        return this.prisma.factoryLayout.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                description: true,
                isLocked: true,
                version: true,
                updatedAt: true
            },
            orderBy: { updatedAt: 'desc' }
        });
    }

    /**
     * Get a single layout with all nodes and edges
     * @param layoutId - Layout ID
     * @param tenantId - Tenant ID from session
     */
    async getLayout(layoutId: string, tenantId: string) {
        const layout = await this.prisma.factoryLayout.findUnique({
            where: {
                id: layoutId,
                tenantId // Tenant isolation
            },
            include: {
                nodes: {
                    include: {
                        asset: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                status: true,
                                imageUrl: true,
                                description: true
                            }
                        }
                    }
                },
                edges: {
                    include: {
                        conveyorSystem: {
                            select: {
                                id: true,
                                name: true,
                                color: true
                            }
                        }
                    }
                }
            }
        });

        if (!layout) {
            throw new Error('Layout not found');
        }

        return layout;
    }

    /**
     * Update layout metadata (name, description, viewport)
     * @param layoutId - Layout ID
     * @param tenantId - Tenant ID from session
     * @param dto - Update data
     */
    async updateLayoutMetadata(layoutId: string, tenantId: string, dto: UpdateLayoutMetadataDto) {
        // Verify ownership
        const layout = await this.prisma.factoryLayout.findUnique({
            where: { id: layoutId, tenantId }
        });

        if (!layout) {
            throw new Error('Layout not found');
        }

        if (layout.isLocked) {
            throw new Error('Cannot modify locked layout');
        }

        return this.prisma.factoryLayout.update({
            where: { id: layoutId, tenantId },
            data: {
                name: dto.name,
                description: dto.description,
                viewportJson: dto.viewportJson
            }
        });
    }

    /**
     * Toggle lock state of a layout
     * @param layoutId - Layout ID
     * @param tenantId - Tenant ID from session
     */
    async toggleLock(layoutId: string, tenantId: string) {
        const layout = await this.prisma.factoryLayout.findUnique({
            where: { id: layoutId, tenantId }
        });

        if (!layout) {
            throw new Error('Layout not found');
        }

        return this.prisma.factoryLayout.update({
            where: { id: layoutId, tenantId },
            data: {
                isLocked: !layout.isLocked,
                version: { increment: 1 } // Optimistic locking
            }
        });
    }

    /**
     * Bulk save graph state (nodes and edges)
     * Implements optimistic concurrency control via version checking
     * @param layoutId - Layout ID
     * @param tenantId - Tenant ID from session
     * @param dto - Graph data with version
     */
    async bulkSaveGraph(layoutId: string, tenantId: string, dto: BulkSaveGraphDto) {
        // Verify ownership and version
        const layout = await this.prisma.factoryLayout.findUnique({
            where: { id: layoutId, tenantId }
        });

        if (!layout) {
            throw new Error('Layout not found');
        }

        if (layout.isLocked) {
            throw new Error('Cannot modify locked layout');
        }

        // Optimistic locking: Check version
        if (layout.version !== dto.version) {
            throw new Error('Layout has been modified by another user. Please refresh and try again.');
        }

        // Validate all assets belong to this tenant
        const assetIds = dto.nodes.map(n => n.assetId);
        const assets = await this.prisma.asset.findMany({
            where: {
                id: { in: assetIds },
                tenantId
            },
            select: { id: true }
        });

        if (assets.length !== assetIds.length) {
            throw new Error('Invalid asset references detected');
        }

        // Use transaction to ensure atomicity
        const result = await this.prisma.$transaction(async (tx) => {
            // Delete existing nodes and edges (cascading deletes will handle edges)
            await tx.factoryLayoutNode.deleteMany({
                where: { layoutId }
            });

            // Create new nodes
            const createdNodes = await Promise.all(
                dto.nodes.map(node =>
                    tx.factoryLayoutNode.create({
                        data: {
                            id: node.id,
                            layoutId,
                            tenantId,
                            assetId: node.assetId,
                            x: node.x,
                            y: node.y,
                            width: node.width,
                            height: node.height,
                            rotation: node.rotation,
                            metaJson: node.metaJson
                        }
                    })
                )
            );

            // Create new edges
            await Promise.all(
                dto.edges.map(edge =>
                    tx.factoryLayoutEdge.create({
                        data: {
                            id: edge.id,
                            layoutId,
                            tenantId,
                            sourceNodeId: edge.sourceNodeId,
                            targetNodeId: edge.targetNodeId,
                            type: edge.type,
                            conveyorSystemId: edge.conveyorSystemId,
                            label: edge.label,
                            metaJson: edge.metaJson
                        }
                    })
                )
            );

            // Update layout version
            const updatedLayout = await tx.factoryLayout.update({
                where: { id: layoutId, tenantId },
                data: {
                    version: { increment: 1 }
                }
            });

            return updatedLayout;
        });

        return result;
    }

    /**
     * Delete a layout and all its nodes/edges (cascade)
     * @param layoutId - Layout ID
     * @param tenantId - Tenant ID from session
     */
    async deleteLayout(layoutId: string, tenantId: string) {
        const layout = await this.prisma.factoryLayout.findUnique({
            where: { id: layoutId, tenantId }
        });

        if (!layout) {
            throw new Error('Layout not found');
        }

        return this.prisma.factoryLayout.delete({
            where: { id: layoutId, tenantId }
        });
    }

    /**
     * Update a single node's position (Optimistic UI support)
     * @param layoutId 
     * @param nodeId 
     * @param tenantId 
     * @param x 
     * @param y 
     */
    async updateNodePosition(layoutId: string, nodeId: string, tenantId: string, x: number, y: number) {
        // 1. Verify Layout Ownership & Lock Status
        const layout = await this.prisma.factoryLayout.findUnique({
            where: { id: layoutId, tenantId },
            select: { isLocked: true }
        });

        if (!layout) throw new Error('Layout not found');
        if (layout.isLocked) throw new Error('Cannot modify locked layout');

        // 2. Update Node
        // We do NOT increment version here to avoid race conditions on high-frequency drag events
        // The version is primarily for "Save Checkpoints"
        return this.prisma.factoryLayoutNode.update({
            where: { id: nodeId, layoutId }, // layoutId ensures it belongs to the layout
            data: { x, y }
        });
    }

    /**
     * Create a new node in the layout
     * @param layoutId 
     * @param tenantId 
     * @param data 
     */
    async createNode(layoutId: string, tenantId: string, data: { assetId: string, x: number, y: number }) {
        // 1. Verify Layout
        const layout = await this.prisma.factoryLayout.findUnique({
            where: { id: layoutId, tenantId },
            select: { isLocked: true }
        });

        if (!layout) throw new Error('Layout not found');
        if (layout.isLocked) throw new Error('Cannot modify locked layout');

        // 2. Verify Asset
        const asset = await this.prisma.asset.findUnique({
            where: { id: data.assetId, tenantId }
        });

        if (!asset) throw new Error('Asset not found');

        // 3. Create Node & Increment Version
        return this.prisma.$transaction(async (tx) => {
            const node = await tx.factoryLayoutNode.create({
                data: {
                    layoutId,
                    tenantId,
                    assetId: data.assetId,
                    x: data.x,
                    y: data.y,
                    width: 150, // Default width
                    height: 100 // Default height
                },
                include: {
                    asset: {
                        select: {
                            id: true,
                            name: true,
                            status: true,
                            imageUrl: true,
                            code: true
                        }
                    }
                }
            });

            await tx.factoryLayout.update({
                where: { id: layoutId },
                data: { version: { increment: 1 } }
            });

            return node;
        });
    }

    /**
     * Delete a node from the layout
     * @param layoutId 
     * @param nodeId 
     * @param tenantId 
     */
    async deleteNode(layoutId: string, nodeId: string, tenantId: string) {
        // 1. Verify Layout
        const layout = await this.prisma.factoryLayout.findUnique({
            where: { id: layoutId, tenantId },
            select: { isLocked: true }
        });

        if (!layout) throw new Error('Layout not found');
        if (layout.isLocked) throw new Error('Cannot modify locked layout');

        // 2. Delete Node (Edges cascade automatically via DB constraints usually, strictly we should ensure)
        return this.prisma.$transaction(async (tx) => {
            // Check existence
            const node = await tx.factoryLayoutNode.findFirst({
                where: { id: nodeId, layoutId, tenantId }
            });

            if (!node) throw new Error('Node not found');

            // Delete connected edges manually if schema doesn't CASCADE
            await tx.factoryLayoutEdge.deleteMany({
                where: {
                    OR: [
                        { sourceNodeId: nodeId },
                        { targetNodeId: nodeId }
                    ],
                    layoutId
                }
            });

            await tx.factoryLayoutNode.delete({
                where: { id: nodeId }
            });

            await tx.factoryLayout.update({
                where: { id: layoutId },
                data: { version: { increment: 1 } }
            });
        });
    }
}
