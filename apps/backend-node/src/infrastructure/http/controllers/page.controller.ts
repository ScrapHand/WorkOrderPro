import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { logger } from '../../logging/logger';

export class PageController {
    constructor(private prisma: PrismaClient) { }

    /**
     * GET /api/pages/:key
     * Retrieve page configuration for the current tenant
     */
    getPage = async (req: Request, res: Response) => {
        const tenant = getCurrentTenant();
        const { key } = req.params;
        try {
            if (!tenant) return res.status(401).json({ error: 'Tenant context missing' });

            logger.info({ tenantId: tenant.id, key }, 'Fetching page configuration');

            const page = await this.prisma.page.findUnique({
                where: {
                    tenantId_key: {
                        tenantId: tenant.id,
                        key
                    }
                }
            });

            if (!page) {
                logger.debug({ tenantId: tenant.id, key }, 'Page configuration not found');
                return res.status(404).json({ error: 'Page configuration not found' });
            }

            res.json(page);
        } catch (error: any) {
            logger.error({ error, tenantId: tenant?.id, key }, 'Failed to fetch page configuration');
            res.status(500).json({ error: 'Failed to fetch page configuration' });
        }
    };

    /**
     * PUT /api/pages/:key
     * Upsert page configuration for the current tenant
     */
    updatePage = async (req: Request, res: Response) => {
        const tenant = getCurrentTenant();
        const { key } = req.params;
        const { layoutJson } = req.body;

        try {
            if (!tenant) return res.status(401).json({ error: 'Tenant context missing' });

            logger.info({ tenantId: tenant.id, key }, 'Updating page configuration');

            const page = await this.prisma.page.upsert({
                where: {
                    tenantId_key: {
                        tenantId: tenant.id,
                        key
                    }
                },
                update: {
                    layoutJson: layoutJson || {}
                },
                create: {
                    tenantId: tenant.id,
                    key,
                    layoutJson: layoutJson || {}
                }
            });

            logger.info({ pageId: page.id, tenantId: tenant.id, key }, 'Page configuration updated successfully');
            res.json(page);
        } catch (error: any) {
            logger.error({ error, tenantId: tenant?.id, key }, 'Failed to update page configuration');
            res.status(500).json({ error: 'Failed to update page configuration' });
        }
    };
}
