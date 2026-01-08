import { PrismaClient } from '@prisma/client';

export interface CreateConveyorSystemDto {
    name: string;
    color?: string;
    description?: string;
}

export interface UpdateConveyorSystemDto {
    name?: string;
    color?: string;
    description?: string;
}

export class ConveyorSystemService {
    constructor(private prisma: PrismaClient) { }

    /**
     * Create a new conveyor system
     * @param tenantId - Tenant ID from session
     * @param dto - Conveyor system creation data
     */
    async createSystem(tenantId: string, dto: CreateConveyorSystemDto) {
        return this.prisma.conveyorSystem.create({
            data: {
                tenantId,
                name: dto.name,
                color: dto.color || '#808080',
                description: dto.description
            }
        });
    }

    /**
     * Get all conveyor systems for a tenant
     * @param tenantId - Tenant ID from session
     */
    async listSystems(tenantId: string) {
        return this.prisma.conveyorSystem.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { edges: true }
                }
            },
            orderBy: { name: 'asc' }
        });
    }

    /**
     * Get a single conveyor system by ID
     * @param id - System ID
     * @param tenantId - Tenant ID from session
     */
    async getSystem(id: string, tenantId: string) {
        const system = await this.prisma.conveyorSystem.findUnique({
            where: { id, tenantId },
            include: {
                edges: {
                    select: {
                        id: true,
                        label: true,
                        layoutId: true
                    }
                }
            }
        });

        if (!system) {
            throw new Error('Conveyor system not found');
        }

        return system;
    }

    /**
     * Update a conveyor system
     * @param id - System ID
     * @param tenantId - Tenant ID from session
     * @param dto - Update data
     */
    async updateSystem(id: string, tenantId: string, dto: UpdateConveyorSystemDto) {
        const system = await this.prisma.conveyorSystem.findUnique({
            where: { id, tenantId }
        });

        if (!system) {
            throw new Error('Conveyor system not found');
        }

        return this.prisma.conveyorSystem.update({
            where: { id, tenantId },
            data: {
                name: dto.name,
                color: dto.color,
                description: dto.description
            }
        });
    }

    /**
     * Delete a conveyor system
     * Sets conveyorSystemId to null on all edges that reference it
     * @param id - System ID
     * @param tenantId - Tenant ID from session
     */
    async deleteSystem(id: string, tenantId: string) {
        const system = await this.prisma.conveyorSystem.findUnique({
            where: { id, tenantId }
        });

        if (!system) {
            throw new Error('Conveyor system not found');
        }

        // First, remove system reference from all edges
        await this.prisma.factoryLayoutEdge.updateMany({
            where: { conveyorSystemId: id },
            data: { conveyorSystemId: null }
        });

        // Then delete the system
        return this.prisma.conveyorSystem.delete({
            where: { id, tenantId }
        });
    }
}
