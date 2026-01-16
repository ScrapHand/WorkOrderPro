import { Request, Response } from 'express';
import { PartService } from '../../../application/services/part.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../logging/logger';

export class PartController {
    constructor(
        private partService: PartService,
        private prisma: PrismaClient
    ) { }

    create = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            const { name, SKU } = req.body;
            logger.info({ tenantId, name, SKU }, 'Creating new inventory part');

            const part = await this.partService.create(tenantId, req.body);

            logger.info({ partId: part.id, tenantId }, 'Inventory part created successfully');
            res.status(201).json(part);
        } catch (error) {
            logger.error({ error, tenantId }, 'Failed to create inventory part');
            res.status(500).json({ error: 'Failed to create part' });
        }
    };

    getAll = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            logger.info({ tenantId }, 'Fetching all inventory parts');
            const parts = await this.partService.getAll(tenantId);
            res.json(parts);
        } catch (error) {
            logger.error({ error, tenantId }, 'Failed to fetch inventory parts');
            res.status(500).json({ error: 'Failed to fetch parts' });
        }
    };

    update = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { id } = req.params;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            logger.info({ partId: id, tenantId }, 'Updating inventory part');
            const part = await this.partService.update(id, tenantId, req.body);

            res.json(part);
        } catch (error) {
            logger.error({ error, partId: id, tenantId }, 'Failed to update inventory part');
            res.status(500).json({ error: 'Failed to update part' });
        }
    };

    delete = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { id } = req.params;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            logger.info({ partId: id, tenantId }, 'Deleting inventory part');
            await this.partService.delete(id, tenantId);

            logger.info({ partId: id, tenantId }, 'Inventory part deleted successfully');
            res.status(204).send();
        } catch (error) {
            logger.error({ error, partId: id, tenantId }, 'Failed to delete inventory part');
            res.status(500).json({ error: 'Failed to delete part' });
        }
    };

    getTransactions = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            logger.info({ tenantId }, 'Fetching inventory transactions');
            const transactions = await this.partService.getTransactions(tenantId);
            res.json(transactions);
        } catch (error) {
            logger.error({ error, tenantId }, 'Failed to fetch inventory transactions');
            res.status(500).json({ error: 'Failed to fetch inventory transactions' });
        }
    };
}
