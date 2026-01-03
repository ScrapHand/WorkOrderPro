
import { Request, Response } from 'express';
import { PartService } from '../../../application/services/part.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { PrismaClient } from '@prisma/client';

export class PartController {
    constructor(
        private partService: PartService,
        private prisma: PrismaClient
    ) { }

    create = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            const part = await this.partService.create(tenant.id, req.body);
            res.status(201).json(part);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create part' });
        }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            const parts = await this.partService.getAll(tenant.id);
            res.json(parts);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch parts' });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            const part = await this.partService.update(req.params.id, tenant.id, req.body);
            res.json(part);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to update part' });
        }
    };
}
