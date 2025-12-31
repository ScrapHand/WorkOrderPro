import { Request, Response } from 'express';
import { AssetService } from '../../../application/services/asset.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';

export class AssetController {
    constructor(private assetService: AssetService) { }

    create = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant();
            if (!tenant) return res.status(400).json({ error: 'Tenant context missing' });

            const { name, parentId, description, criticality } = req.body;

            const asset = await this.assetService.createAsset(
                tenant.slug, // Using slug for ID in Phase 1 simplification, really should be UUID. 
                // Wait, schema says tenantId is String.
                // Middleware gives us slug. 
                // Phase 1 verification used 'test-corp' as slug.
                // For now, assume tenantId = slug. In production, middleware resolves slug->uuid.
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
            const tenant = getCurrentTenant();
            if (!tenant) return res.status(400).json({ error: 'Tenant context missing' });

            const { id } = req.params;
            const tree = await this.assetService.getAssetTree(id, tenant.slug);
            res.json(tree);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
