import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getCurrentTenant } from '../../middleware/tenant.middleware';

export class DebugController {
    constructor(private prisma: PrismaClient) { }

    getTenantStatus = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant();

            // Check DB connection basic health
            let dbStatus = "UNKNOWN";
            try {
                // Simple query to Ping DB
                await this.prisma.$queryRaw`SELECT 1`;
                dbStatus = "OK";
            } catch (e: any) {
                dbStatus = `ERROR: ${e.message}`;
            }

            res.json({
                status: "ONLINE",
                timestamp: new Date().toISOString(),
                context: {
                    tenantId: tenant?.id || "N/A",
                    slug: tenant?.slug || "N/A",
                    userRole: (req as any).user?.role || "GUEST", // Assuming AuthMiddleware populates req.user
                    cookie: req.headers.cookie ? "PRESENT" : "MISSING",
                    protocol: req.protocol, // [DEBUG] Check if http or https
                    secure: req.secure, // [DEBUG] Check if Express thinks it is secure
                    nodeEnv: process.env.NODE_ENV
                },
                database: {
                    status: dbStatus
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
