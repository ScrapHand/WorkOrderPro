import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export class PlatformAdminController {
    constructor(private prisma: PrismaClient) { }

    getAuditLogs = async (req: Request, res: Response) => {
        try {
            const user = (req.session as any)?.user;
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            const { tenantId: queryTenantId, event, limit = 50, offset = 0 } = req.query;

            const where: any = {};

            // [TENANT ISOLATION] Enforce tenant context for non-global admins
            const isGlobalAdmin = user.role === 'SUPER_ADMIN' || user.role === 'GLOBAL_ADMIN';

            if (!isGlobalAdmin) {
                // Strictly lock to their own tenant
                where.tenantId = user.tenantId;
            } else if (queryTenantId) {
                // Global admins can filter by a specific tenant or see all
                where.tenantId = queryTenantId as string;
            }

            if (event) where.event = event as string;

            const logs = await this.prisma.auditLog.findMany({
                where,
                take: Number(limit),
                skip: Number(offset),
                orderBy: { timestamp: 'desc' },
                include: {
                    user: {
                        select: {
                            email: true,
                            username: true
                        }
                    }
                }
            });

            res.json(logs);
        } catch (error: any) {
            console.error('Fetch Audit Logs Error:', error);
            res.status(500).json({ error: 'Failed to fetch audit logs' });
        }
    };

    /**
     * Search users across all tenants.
     */
    globalUserSearch = async (req: Request, res: Response) => {
        try {
            const { q } = req.query;
            if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

            const users = await this.prisma.user.findMany({
                where: {
                    OR: [
                        { email: { contains: q as string, mode: 'insensitive' } },
                        { username: { contains: q as string, mode: 'insensitive' } }
                    ]
                },
                include: {
                    tenant: { select: { name: true, slug: true } }
                },
                take: 20
            });

            res.json(users.map(u => {
                const { passwordHash, ...rest } = u;
                return rest;
            }));
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to search users' });
        }
    };
}
