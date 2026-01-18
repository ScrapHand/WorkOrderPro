
import { PrismaClient } from '@prisma/client';
import { logger } from '../../infrastructure/logging/logger';

export class SuperAdminService {
    constructor(private prisma: PrismaClient) { }

    async getGlobalStats() {
        const [tenants, users, workOrders, assets] = await Promise.all([
            this.prisma.tenant.count(),
            this.prisma.user.count(),
            this.prisma.workOrder.count(),
            this.prisma.asset.count()
        ]);

        // Platform growth (e.g., last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newTenants = await this.prisma.tenant.count({
            where: { createdAt: { gte: thirtyDaysAgo } }
        });

        return {
            counters: { tenants, users, workOrders, assets },
            growth: { newTenants30d: newTenants },
            status: 'Operational'
        };
    }

    async listTenants() {
        return this.prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                plan: true,
                features: true,
                createdAt: true,
                _count: {
                    select: {
                        users: true,
                        workOrders: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async provisionTenant(adminId: string, tenantId: string, features: any) {
        return this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.update({
                where: { id: tenantId },
                data: { features }
            });

            await tx.platformLog.create({
                data: {
                    adminId,
                    action: 'PROVISION_TENANT',
                    targetId: tenantId,
                    metadata: features as any
                }
            });

            logger.info({ adminId, tenantId, features }, 'Tenant provisioned with new features');
            return tenant;
        });
    }

    async getPlatformLogs() {
        return this.prisma.platformLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100
        });
    }

    async listUsers(search?: string) {
        return this.prisma.user.findMany({
            where: search ? {
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } }
                ]
            } : {},
            include: {
                tenant: {
                    select: { name: true, slug: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }

    async deleteUser(adminId: string, userId: string) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.delete({ where: { id: userId } });

            await tx.platformLog.create({
                data: {
                    adminId,
                    action: 'DELETE_USER',
                    targetId: userId,
                    metadata: { email: user.email, tenantId: user.tenantId }
                }
            });

            return user;
        });
    }
}
