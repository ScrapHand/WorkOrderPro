
import { Request, Response } from 'express';
import { PartService } from '../../../application/services/part.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';

export class PartController {
    constructor(private partService: PartService) { }

    create = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant(req);
            const part = await this.partService.create(tenant.id, req.body);
            res.status(201).json(part);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create part' });
        }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant(req);
            const parts = await this.partService.getAll(tenant.id);
            res.json(parts);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch parts' });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant(req);
            const part = await this.partService.update(req.params.id, tenant.id, req.body);
            res.json(part);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to update part' });
        }
    };
}
