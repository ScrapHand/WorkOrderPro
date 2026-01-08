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
}
