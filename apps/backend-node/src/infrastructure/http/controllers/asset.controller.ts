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

            // [OPTIMIZATION] Use ID from middleware
            const tenantId = tenantCtx.id;
            if (!tenantId) return res.status(400).json({ error: 'Tenant context ID missing' });

            const { name, parentId, description, criticality, imageUrl, lotoConfig } = req.body;

            const asset = await this.assetService.createAsset(
                tenantId,
                name,
                parentId || null,
                description,
                criticality,
                imageUrl,
                lotoConfig
            );

            res.status(201).json(asset);
        } catch (error: any) {
            console.error('Create Asset Error:', error);
            res.status(500).json({ error: error.message });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            // [OPTIMIZATION] Use ID from middleware
            const tenantId = tenantCtx.id;
            if (!tenantId) return res.status(400).json({ error: 'Tenant context ID missing' });

            const { id } = req.params;
            const data = req.body;

            // Prevent updating read-only fields or tenantId
            delete data.id;
            delete data.tenantId;
            delete data.createdAt;
            delete data.updatedAt;

            const updated = await this.prisma.asset.update({
                where: { id, tenantId },
                data
            });

            res.json(updated);
        } catch (error: any) {
            console.error("Update Asset Error:", error);
            res.status(500).json({ error: error.message });
        }
    };

    getTree = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            // [OPTIMIZATION] Use ID from middleware
            const tenantId = tenantCtx.id;
            if (!tenantId) return res.status(400).json({ error: 'Tenant context ID missing' });

            const { id } = req.params;
            const tree = await this.assetService.getAssetTree(id, tenantId);
            res.json(tree);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            // [OPTIMIZATION] Use ID from middleware
            const tenantId = tenantCtx.id;
            if (!tenantId) return res.status(400).json({ error: 'Tenant context ID missing' });

            const assets = await this.assetService.getAllAssets(tenantId);
            res.json(assets);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            // [OPTIMIZATION] Use ID from middleware
            const tenantId = tenantCtx.id;
            if (!tenantId) return res.status(400).json({ error: 'Tenant context ID missing' });

            const { id } = req.params;
            const asset = await this.prisma.asset.findFirst({
                where: { id, tenantId }
            });

            if (!asset) return res.status(404).json({ error: 'Asset not found' });

            await this.prisma.asset.update({
                where: { id },
                data: { deletedAt: new Date() }
            });

            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    saveLayout = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            // [OPTIMIZATION] Use ID from middleware
            const tenantId = tenantCtx.id;
            if (!tenantId) return res.status(400).json({ error: 'Tenant context ID missing' });

            const { layout, scope } = req.body;
            const user = (req.session as any).user;
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            if (scope === 'user') {
                const currentUser = await this.prisma.user.findUnique({ where: { id: user.id } });
                const currentPrefs = ((currentUser as any)?.preferences) || {};
                const newPrefs = { ...currentPrefs, assetLayout: layout };

                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { preferences: newPrefs } as any
                });
            } else if (scope === 'global') {
                if (user.role !== 'ADMIN' && user.role !== 'MANAGER') return res.status(403).json({ error: 'Forbidden' });

                await Promise.all(
                    Object.entries(layout).map(([assetId, pos]) =>
                        this.prisma.asset.update({
                            where: { id: assetId, tenantId: tenantId },
                            data: { metadata: { position: pos } } as any
                        })
                    )
                );
            }

            res.status(200).json({ success: true });
        } catch (error: any) {
            console.error('Save Layout Error:', error);
            res.status(500).json({ error: error.message });
        }
    };
}
