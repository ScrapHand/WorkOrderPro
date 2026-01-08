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
        const lines = await this.prisma.productionLine.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { assets: true }
                },
                assets: {
                    select: { status: true }
                },
                connections: {
                    select: { speedLimit: true, sourceAsset: { select: { maxSpeed: true } } }
                }
            }
        });

        // Add virtual bottleneckCount
        return lines.map(line => {
            let bottleneckCount = 0;

            // Count DOWN assets
            bottleneckCount += line.assets.filter(a => a.status === 'DOWN' || a.status === 'MAINTENANCE').length;

            // Count speed mismatches
            line.connections.forEach(conn => {
                const sourceMaxSpeed = (conn.sourceAsset as any)?.maxSpeed || 0;
                if (conn.speedLimit && sourceMaxSpeed > conn.speedLimit) {
                    bottleneckCount++;
                }
            });

            return {
                ...line,
                assetCount: line._count.assets,
                bottleneckCount
            };
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
        const assetThroughputs: Record<string, number> = {};

        // 1. Calculate base throughputs and identify immediate constraints
        for (const conn of line.connections) {
            const source = conn.sourceAsset;
            const sourceMaxSpeed = (source as any).maxSpeed || 0;
            const speedLimit = conn.speedLimit || sourceMaxSpeed;

            // Efficiency = Actual Limit / Source Potential
            const efficiency = sourceMaxSpeed > 0 ? Math.min(100, (speedLimit / sourceMaxSpeed) * 100) : 100;

            if (efficiency < 100) {
                bottlenecks.push({
                    type: 'CONVEYOR_LIMIT',
                    severity: efficiency < 50 ? 'HIGH' : 'MEDIUM',
                    assetId: source.id,
                    connectionId: conn.id,
                    efficiency,
                    message: `Connection limits ${source.name}'s output to ${efficiency.toFixed(1)}% efficiency.`
                });
            }

            assetThroughputs[source.id] = speedLimit;
        }

        // 2. Identify "Starved" or "Blocked" nodes
        // (Simplified for MVP: Any machine in MAINTENANCE or DOWN is a HIGH severity bottleneck)
        for (const asset of line.assets) {
            if (asset.status === 'DOWN' || asset.status === 'MAINTENANCE') {
                bottlenecks.push({
                    type: 'MACHINE_STATUS',
                    severity: asset.status === 'DOWN' ? 'HIGH' : 'MEDIUM',
                    assetId: asset.id,
                    message: `System Flow Interrupted: ${asset.name} is ${asset.status}.`
                });
            }
        }

        return {
            lineId: id,
            bottlenecks,
            analyzedAt: new Date()
        };
    }
}
