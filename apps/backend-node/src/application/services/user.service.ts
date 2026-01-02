import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
        const passwordHash = await bcrypt.hash(passwordToHash, 10);

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
            updateData.passwordHash = await bcrypt.hash(password, 10);
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

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
            include: { tenant: true }
        });
    }

    async resolveTenantId(slug: string): Promise<string | null> {
        const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
        return tenant?.id || null;
    }
}
