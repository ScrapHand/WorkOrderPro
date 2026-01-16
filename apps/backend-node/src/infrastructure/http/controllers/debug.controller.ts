import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { logger } from '../../logging/logger';

export class DebugController {
    constructor(private prisma: PrismaClient) { }

    getTenantStatus = async (req: Request, res: Response) => {
        const tenant = getCurrentTenant();
        try {
            logger.info({
                tenantSlug: tenant?.slug,
                userId: (req.session as any)?.user?.id
            }, 'Providing system diagnostic status');

            // Check DB connection basic health
            let dbStatus = "UNKNOWN";
            let sessionCount: any = -1;
            try {
                // Simple query to Ping DB
                await this.prisma.$queryRaw`SELECT 1`;
                dbStatus = "OK";

                // [PHASE 18] Check Session Table
                const countResult: any = await this.prisma.$queryRaw`SELECT count(*) FROM "session"`;
                // Handle BigInt or raw structure
                sessionCount = countResult[0]?.count ? Number(countResult[0].count) : "Error parsing count";

            } catch (e: any) {
                dbStatus = `ERROR: ${e.message}`;
                logger.error({ error: e }, 'Database health check failed');
            }

            res.json({
                status: "ONLINE",
                timestamp: new Date().toISOString(),
                context: {
                    tenantId: tenant?.id || "N/A",
                    slug: tenant?.slug || "N/A",
                    userRole: (req.session as any)?.user?.role || "GUEST",
                    cookie: req.headers.cookie ? "PRESENT" : "MISSING",
                    protocol: req.protocol,
                    secure: req.secure,
                    nodeEnv: process.env.NODE_ENV
                },
                meta: {
                    cookiesReceived: req.headers.cookie ? 'YES' : 'NONE',
                    cookieDump: req.headers.cookie,
                    host: req.hostname,
                    protocol: req.protocol,
                    ip: req.ip,
                    sessionID: req.sessionID,
                    sessionCount: sessionCount
                },
                diagnostics: {
                    headers: req.headers,
                    sessionID: req.sessionID,
                    sessionData: req.session
                },
                database: {
                    status: dbStatus
                }
            });
        } catch (error: any) {
            logger.error({ error }, 'Fatal error during diagnostic request');
            res.status(500).json({ error: error.message });
        }
    };
}
