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
                meta: {
                    cookiesReceived: req.headers.cookie ? 'YES' : 'NONE',
                    cookieDump: req.headers.cookie, // [DEBUG] Show raw string
                    host: req.hostname,           // [DEBUG] Did Vercel rewrite this?
                    protocol: req.protocol,       // [DEBUG] Is it https?
                    ip: req.ip,                   // [DEBUG] Proxy IP vs Real IP
                    sessionID: req.sessionID,     // [DEBUG] Persistence Check
                    sessionCount: sessionCount    // [DEBUG] DB Table Check
                },
                diagnostics: {
                    headers: req.headers, // [FORENSIC] See exactly what Render sends us
                    sessionID: req.sessionID,
                    sessionData: req.session // [FORENSIC] See if the session store loaded anything
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
