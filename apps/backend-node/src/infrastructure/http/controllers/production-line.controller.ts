import { Request, Response } from 'express';
import { ProductionLineService } from '../../../application/services/production-line.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';

export class ProductionLineController {
    constructor(private lineService: ProductionLineService) { }

    getAll = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant();
            if (!tenant) return res.status(401).json({ error: 'Tenant context missing' });

            const lines = await this.lineService.getLines(tenant.id);
            res.json(lines);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    create = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant();
            if (!tenant) return res.status(401).json({ error: 'Tenant context missing' });

            const line = await this.lineService.createLine(tenant.id, req.body);
            res.status(201).json(line);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getById = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant();
            if (!tenant) return res.status(401).json({ error: 'Tenant context missing' });

            const line = await this.lineService.getLineById(req.params.id, tenant.id);
            if (!line) return res.status(404).json({ error: 'Line not found' });

            res.json(line);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    addConnection = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant();
            if (!tenant) return res.status(401).json({ error: 'Tenant context missing' });

            const conn = await this.lineService.addConnection(tenant.id, req.params.id, req.body);
            res.status(201).json(conn);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    analyze = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant();
            if (!tenant) return res.status(401).json({ error: 'Tenant context missing' });

            const result = await this.lineService.analyzeLine(req.params.id, tenant.id);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
