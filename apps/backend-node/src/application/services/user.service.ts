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
        console.log(`[RBAC] getUserPermissions called for userId: ${userId}`);

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { customRole: true }
        });

        if (!user) {
            console.log(`[RBAC] No user found for id: ${userId}`);
            return [];
        }

        console.log(`[RBAC] User found: ${user.email}, role: ${user.role}, tenantId: ${user.tenantId}`);

        // 1. Super Admin Bypass (Optimization)
        if (user.role === 'SUPER_ADMIN' || user.role === 'GLOBAL_ADMIN') {
            console.log(`[RBAC] ${user.role} bypass - returning ['*']`);
            return ['*'];
        }

        // 2. Custom Role
        if (user.customRoleId && user.customRole) {
            console.log(`[RBAC] Custom role found: ${user.customRole.name}`);
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

        console.log(`[RBAC] System role lookup result: ${systemRole ? `found (${(systemRole.permissions as any)?.length || 'unknown'} perms)` : 'NOT FOUND'}`);

        // 3.5. [SELF-HEALING] Auto-seed roles if user's role is missing
        if (!systemRole) {
            console.log(`[RBAC] Auto-seeding roles for tenant ${user.tenantId} (missing role: ${user.role})`);
            await this.seedDefaultRolesForTenant(user.tenantId);
            // Retry lookup
            systemRole = await this.prisma.role.findFirst({
                where: { tenantId: user.tenantId, name: user.role }
            });
            console.log(`[RBAC] After seeding, role lookup result: ${systemRole ? 'found' : 'STILL NOT FOUND'}`);
        }

        if (systemRole) {
            const perms = systemRole.permissions;
            console.log(`[RBAC] Returning permissions from system role: ${JSON.stringify(perms).substring(0, 100)}`);
            if (typeof perms === 'string') return JSON.parse(perms);
            if (Array.isArray(perms)) return perms as string[];
        }

        // 4. Fallback (Legacy/Safety) - Be generous for admin-like roles
        const adminRoles = ['ADMIN', 'TENANT_ADMIN', 'GLOBAL_ADMIN', 'MANAGER'];
        if (adminRoles.includes(user.role)) {
            console.log(`[RBAC] Fallback for ${user.role} - returning ['*']`);
            return ['*'];
        }

        // 5. Last resort - at least give basic read permissions
        console.log(`[RBAC] No permissions found, returning basic read permissions for safety`);
        return ['work_order:read', 'work_order:write', 'asset:read', 'inventory:read'];
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
