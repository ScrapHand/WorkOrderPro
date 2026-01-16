import { PrismaClient, User } from '@prisma/client';
import * as argon2 from 'argon2';

export class UserService {
    constructor(private prisma: PrismaClient) { }

    async createUser(
        tenantId: string,
        email: string,
        role: string,
        plainPassword?: string,
        username?: string
    ): Promise<User> {
        // Default password if not provided
        const passwordToHash = plainPassword || 'temp1234';
        const passwordHash = await argon2.hash(passwordToHash);

        // [PROTOCOL] Enforce Subscription Limits
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new Error("Tenant not found");

        const currentUsers = await this.prisma.user.count({ where: { tenantId, deletedAt: null } });
        if (currentUsers >= tenant.maxUsers) {
            throw new Error(`Subscription limit reached: Max ${tenant.maxUsers} users.`);
        }

        // [NEW] Enforce Admin Limits
        if (role === 'ADMIN') {
            const currentAdmins = await this.prisma.user.count({
                where: { tenantId, role: 'ADMIN', deletedAt: null }
            });
            if (currentAdmins >= tenant.maxAdmins) {
                throw new Error(`Subscription limit reached: Max ${tenant.maxAdmins} admins.`);
            }
        }

        return this.prisma.user.create({
            data: {
                tenantId,
                email,
                role,
                passwordHash,
                username
            }
        });
    }

    async updateUser(id: string, data: Partial<User>): Promise<User> {
        // Drop passwordHash and system fields from generic update
        const { passwordHash, id: _id, tenantId, createdAt, updatedAt, deletedAt, ...rest } = data;
        return this.prisma.user.update({
            where: { id },
            data: rest as any
        });
    }

    async updateUserWithPassword(id: string, data: any): Promise<User> {
        const { password, id: _id, tenantId, createdAt, updatedAt, deletedAt, ...rest } = data;
        const updateData: any = { ...rest };

        if (password) {
            updateData.passwordHash = await argon2.hash(password);
        }

        return this.prisma.user.update({
            where: { id },
            data: updateData as any
        });
    }

    async deleteUser(id: string): Promise<User> {
        // Soft delete to preserve referential integrity
        return this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date(), email: `deleted_${id}@example.com` } // Rename email to allow re-creation if needed
        });
    }

    async updateUserPassword(id: string, passwordHash: string): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: { passwordHash }
        });
    }

    async getAllUsers(tenantId: string): Promise<User[]> {
        return this.prisma.user.findMany({
            where: {
                tenantId,
                deletedAt: null
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByEmail(email: string, tenantId?: string): Promise<User | null> {
        const where: any = { email };
        if (tenantId) {
            where.tenantId = tenantId;
        }
        return this.prisma.user.findFirst({
            where,
            include: { tenant: true }
        });
    }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
            include: { tenant: true }
        });
    }

    async resolveTenantId(slug: string): Promise<string | null> {
        const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
        return tenant?.id || null;
    }

    async getUserPermissions(userId: string): Promise<string[]> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { customRole: true }
        });

        if (!user) return [];

        // 1. Super Admin Bypass (Optimization)
        if (user.role === 'SUPER_ADMIN') return ['*'];

        // 2. Custom Role
        if (user.customRoleId && user.customRole) {
            // Prisma JSON type handling
            const perms = user.customRole.permissions;
            if (typeof perms === 'string') return JSON.parse(perms);
            if (Array.isArray(perms)) return perms as string[];
            return [];
        }

        // 3. System Role (Lookup by Name)
        let systemRole = await this.prisma.role.findFirst({
            where: {
                tenantId: user.tenantId,
                name: user.role
            }
        });

        // 3.5. [SELF-HEALING] Auto-seed roles if none exist for tenant
        if (!systemRole) {
            const rolesExist = await this.prisma.role.count({ where: { tenantId: user.tenantId } });
            if (rolesExist === 0) {
                console.log(`[RBAC] Auto-seeding roles for tenant ${user.tenantId}`);
                await this.seedDefaultRolesForTenant(user.tenantId);
                // Retry lookup
                systemRole = await this.prisma.role.findFirst({
                    where: { tenantId: user.tenantId, name: user.role }
                });
            }
        }

        if (systemRole) {
            const perms = systemRole.permissions;
            if (typeof perms === 'string') return JSON.parse(perms);
            if (Array.isArray(perms)) return perms as string[];
        }

        // 4. Fallback (Legacy/Safety)
        if (user.role === 'ADMIN' || user.role === 'TENANT_ADMIN') return ['*'];

        return [];
    }

    // [PRIVATE] Seed default roles for a tenant (duplicated from TenantService for decoupling)
    private async seedDefaultRolesForTenant(tenantId: string) {
        const defaultRoles = [
            { name: 'SUPER_ADMIN', permissions: ['*'] },
            { name: 'TENANT_ADMIN', permissions: ['*'] },
            { name: 'ADMIN', permissions: ['work_order:read', 'work_order:write', 'work_order:delete', 'asset:read', 'asset:write', 'asset:delete', 'inventory:read', 'inventory:write', 'inventory:delete', 'user:read', 'user:write', 'user:delete', 'tenant:write', 'report:read'] },
            { name: 'MANAGER', permissions: ['work_order:read', 'work_order:write', 'asset:read', 'asset:write', 'inventory:read', 'inventory:write', 'user:read', 'report:read'] },
            { name: 'TECHNICIAN', permissions: ['work_order:read', 'work_order:write', 'asset:read', 'inventory:read', 'inventory:write'] },
            { name: 'VIEWER', permissions: ['work_order:read', 'work_order:write', 'asset:read', 'inventory:read'] }
        ];

        for (const role of defaultRoles) {
            await this.prisma.role.upsert({
                where: { tenantId_name: { tenantId, name: role.name } },
                update: { permissions: role.permissions },
                create: { tenantId, name: role.name, description: `Default ${role.name} role`, permissions: role.permissions, isSystem: true }
            });
        }
    }
}
