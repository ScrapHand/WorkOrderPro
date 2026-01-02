import { Role } from '../../domain/entities/role.entity';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { v4 as uuidv4 } from 'uuid';

export class RoleService {
    constructor(private roleRepo: IRoleRepository) { }

    async createRole(tenantId: string, name: string, permissions: string[], description?: string): Promise<Role> {
        const existing = await this.roleRepo.findByName(tenantId, name);
        if (existing) {
            throw new Error(`Role with name '${name}' already exists.`);
        }

        const newRole = new Role(
            uuidv4(),
            tenantId,
            name,
            permissions,
            description,
            false // Default isSystem to false for custom roles
        );

        return this.roleRepo.create(newRole);
    }

    async updateRole(id: string, tenantId: string, updates: Partial<{ name: string; description: string; permissions: string[] }>): Promise<Role> {
        const role = await this.roleRepo.findById(id);
        if (!role) throw new Error('Role not found');
        if (role.tenantId !== tenantId) throw new Error('Unauthorized access to role');

        // Note: System roles might have restrictions, but we allow editing permissions for flexibility if desired.
        // For now, let's protect System Role NAMES from changing, but allow description/permissions.
        if (role.isSystem && updates.name && updates.name !== role.name) {
            throw new Error('Cannot rename system roles.');
        }

        const updatedRole = new Role(
            role.id,
            role.tenantId,
            updates.name || role.name,
            updates.permissions || role.permissions,
            updates.description || role.description,
            role.isSystem,
            role.createdAt,
            new Date()
        );

        return this.roleRepo.update(updatedRole);
    }

    async deleteRole(id: string, tenantId: string): Promise<void> {
        const role = await this.roleRepo.findById(id);
        if (!role) throw new Error('Role not found');
        if (role.tenantId !== tenantId) throw new Error('Unauthorized access to role');
        if (role.isSystem) throw new Error('Cannot delete system roles.');

        await this.roleRepo.delete(id);
    }

    async getRoles(tenantId: string): Promise<Role[]> {
        return this.roleRepo.findAll(tenantId);
    }

    async getRoleById(id: string, tenantId: string): Promise<Role> {
        const role = await this.roleRepo.findById(id);
        if (!role) throw new Error('Role not found');
        if (role.tenantId !== tenantId) throw new Error('Unauthorized access to role');
        return role;
    }
}
