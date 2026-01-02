import { PrismaClient } from '@prisma/client';
import { Role } from '../../domain/entities/role.entity';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';

export class PostgresRoleRepository implements IRoleRepository {
    constructor(private prisma: PrismaClient) { }

    async create(role: Role): Promise<Role> {
        const created = await this.prisma.role.create({
            data: {
                id: role.id,
                tenantId: role.tenantId,
                name: role.name,
                description: role.description,
                permissions: role.permissions,
                isSystem: role.isSystem
            }
        });
        return this.mapToEntity(created);
    }

    async update(role: Role): Promise<Role> {
        const updated = await this.prisma.role.update({
            where: { id: role.id },
            data: {
                name: role.name,
                description: role.description,
                permissions: role.permissions,
                // isSystem is usually immutable or handled carefully
            }
        });
        return this.mapToEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.role.delete({
            where: { id }
        });
    }

    async findById(id: string): Promise<Role | null> {
        const role = await this.prisma.role.findUnique({
            where: { id }
        });
        return role ? this.mapToEntity(role) : null;
    }

    async findAll(tenantId: string): Promise<Role[]> {
        const roles = await this.prisma.role.findMany({
            where: { tenantId }
        });
        return roles.map(r => this.mapToEntity(r));
    }

    async findByName(tenantId: string, name: string): Promise<Role | null> {
        const role = await this.prisma.role.findFirst({
            where: { tenantId, name }
        });
        return role ? this.mapToEntity(role) : null;
    }

    private mapToEntity(prismaRole: any): Role {
        return new Role(
            prismaRole.id,
            prismaRole.tenantId,
            prismaRole.name,
            prismaRole.permissions as string[],
            prismaRole.description,
            prismaRole.isSystem,
            prismaRole.createdAt,
            prismaRole.updatedAt
        );
    }
}
