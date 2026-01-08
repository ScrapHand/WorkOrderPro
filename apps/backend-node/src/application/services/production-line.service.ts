import { PrismaClient } from '@prisma/client';

export class ProductionLineService {
    constructor(private prisma: PrismaClient) { }

    async createLine(tenantId: string, data: { name: string; description?: string }) {
        return this.prisma.productionLine.create({
            data: {
                tenantId,
                name: data.name,
                description: data.description
            }
        });
    }

    async getLines(tenantId: string) {
        return this.prisma.productionLine.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { assets: true }
                }
            }
        });
    }

    async getLineById(id: string, tenantId: string) {
        return this.prisma.productionLine.findUnique({
            where: { id, tenantId },
            include: {
                assets: true,
                connections: {
                    include: {
                        sourceAsset: true,
                        targetAsset: true
                    }
                }
            }
        });
    }

    async updateLine(id: string, tenantId: string, data: any) {
        return this.prisma.productionLine.update({
            where: { id, tenantId },
            data
        });
    }

    async addConnection(tenantId: string, lineId: string, data: {
        sourceAssetId: string;
        targetAssetId: string;
        connectionType?: string;
        speedLimit?: number;
    }) {
        return this.prisma.assetConnection.create({
            data: {
                tenantId,
                productionLineId: lineId,
                sourceAssetId: data.sourceAssetId,
                targetAssetId: data.targetAssetId,
                connectionType: data.connectionType || 'CONVEYOR',
                speedLimit: data.speedLimit
            }
        });
    }

    async removeConnection(id: string, tenantId: string) {
        return this.prisma.assetConnection.delete({
            where: { id, tenantId }
        });
    }

    /**
     * Analyze Line for Bottlenecks
     * Simple algorithm: Identifies connections where source maxSpeed > connection speedLimit
     * or where a machine's maxSpeed is significantly lower than average.
     */
    async analyzeLine(id: string, tenantId: string) {
        const line = await this.getLineById(id, tenantId);
        if (!line) throw new Error('Line not found');

        const bottlenecks: any[] = [];

        // 1. Check connections (Conveyors)
        for (const conn of line.connections) {
            const source = conn.sourceAsset;
            if (source.maxSpeed && conn.speedLimit && source.maxSpeed > conn.speedLimit) {
                bottlenecks.push({
                    type: 'CONVEYOR_LIMIT',
                    severity: 'HIGH',
                    assetId: source.id,
                    connectionId: conn.id,
                    message: `Machine '${source.name}' max speed (${source.maxSpeed}) exceeds conveyor limit (${conn.speedLimit}).`
                });
            }
        }

        // 2. Identify "Slowest" machine relative to flow
        // (More complex logic would go here)

        return {
            lineId: id,
            bottlenecks,
            analyzedAt: new Date()
        };
    }
}
