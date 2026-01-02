import { Role } from '../entities/role.entity';

export interface IRoleRepository {
    create(role: Role): Promise<Role>;
    update(role: Role): Promise<Role>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<Role | null>;
    findAll(tenantId: string): Promise<Role[]>;
    findByName(tenantId: string, name: string): Promise<Role | null>;
}
