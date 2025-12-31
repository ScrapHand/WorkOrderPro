import { Request, Response } from 'express';
import { AssetService } from '../../../application/services/asset.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { PrismaClient } from '@prisma/client';

export class AssetController {
    constructor(
        private assetService: AssetService,
        private prisma: PrismaClient
    ) { }

    create = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            // [FIX] Resolve Tenant Slug to UUID
            const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            const { name, parentId, description, criticality } = req.body;

            const asset = await this.assetService.createAsset(
                tenant.id, // [FIX] Use UUID
                name,
                parentId || null,
                description,
                criticality
            );

            res.status(201).json(asset);
        } catch (error: any) {
            console.error('Create Asset Error:', error);
            res.status(500).json({ error: error.message });
        }
    };

    getTree = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            // [FIX] Resolve Tenant Slug to UUID
            const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            const { id } = req.params;
            const tree = await this.assetService.getAssetTree(id, tenant.id); // [FIX] Use UUID
            res.json(tree);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
