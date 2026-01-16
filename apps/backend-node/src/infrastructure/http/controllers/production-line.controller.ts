import { Request, Response } from 'express';
import { ProductionLineService } from '../../../application/services/production-line.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { logger } from '../../logging/logger';

export class ProductionLineController {
    constructor(private lineService: ProductionLineService) { }

    getAll = async (req: Request, res: Response) => {
        const tenant = getCurrentTenant();
        try {
            if (!tenant) return res.status(401).json({ error: 'Tenant context missing' });

            logger.info({ tenantId: tenant.id }, 'Fetching all production lines');
            const lines = await this.lineService.getLines(tenant.id);
            res.json(lines);
        } catch (error: any) {
            logger.error({ error, tenantId: tenant?.id }, 'Failed to fetch production lines');
            res.status(500).json({ error: error.message });
        }
    };

    create = async (req: Request, res: Response) => {
        const tenant = getCurrentTenant();
        try {
            if (!tenant) return res.status(401).json({ error: 'Tenant context missing' });

            logger.info({ tenantId: tenant.id, name: req.body.name }, 'Creating new production line');
            const line = await this.lineService.createLine(tenant.id, req.body);

            logger.info({ lineId: line.id, tenantId: tenant.id }, 'Production line created successfully');
            res.status(201).json(line);
        } catch (error: any) {
            logger.error({ error, tenantId: tenant?.id }, 'Failed to create production line');
            res.status(500).json({ error: error.message });
        }
    };

    getById = async (req: Request, res: Response) => {
        const tenant = getCurrentTenant();
        const { id } = req.params;
        try {
            if (!tenant) return res.status(401).json({ error: 'Tenant context missing' });

            const line = await this.lineService.getLineById(id, tenant.id);
            if (!line) return res.status(404).json({ error: 'Line not found' });

            res.json(line);
        } catch (error: any) {
            logger.error({ error, lineId: id, tenantId: tenant?.id }, 'Failed to fetch production line by ID');
            res.status(500).json({ error: error.message });
        }
    };

    addConnection = async (req: Request, res: Response) => {
        const tenant = getCurrentTenant();
        const { id } = req.params;
        try {
            if (!tenant) return res.status(401).json({ error: 'Tenant context missing' });

            logger.info({ lineId: id, tenantId: tenant.id }, 'Adding connection to production line');
            const conn = await this.lineService.addConnection(tenant.id, id, req.body);

            logger.info({ connectionId: conn.id, lineId: id, tenantId: tenant.id }, 'Connection added successfully');
            res.status(201).json(conn);
        } catch (error: any) {
            logger.error({ error, lineId: id, tenantId: tenant?.id }, 'Failed to add connection to production line');
            res.status(500).json({ error: error.message });
        }
    };

    analyze = async (req: Request, res: Response) => {
        const tenant = getCurrentTenant();
        const { id } = req.params;
        try {
            if (!tenant) return res.status(401).json({ error: 'Tenant context missing' });

            logger.info({ lineId: id, tenantId: tenant.id }, 'Analyzing production line');
            const result = await this.lineService.analyzeLine(id, tenant.id);
            res.json(result);
        } catch (error: any) {
            logger.error({ error, lineId: id, tenantId: tenant?.id }, 'Failed to analyze production line');
            res.status(500).json({ error: error.message });
        }
    };
}
