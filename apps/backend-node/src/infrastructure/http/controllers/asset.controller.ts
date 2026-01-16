import { Request, Response } from 'express';
import { AssetService } from '../../../application/services/asset.service';
import { AssetImporterService } from '../../../application/services/asset-importer.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { PrismaClient } from '@prisma/client';
import { hasPermission } from '../../auth/rbac.utils';
import { createAssetSchema } from '../../../application/validators/auth.validator';
import { logger } from '../../logging/logger';

export class AssetController {
    constructor(
        private assetService: AssetService,
        private importerService: AssetImporterService,
        private prisma: PrismaClient
    ) { }

    create = async (req: Request, res: Response) => {
        const tenant = getCurrentTenant();
        const tenantId = tenant?.id;
        try {
            if (!tenantId) {
                return res.status(401).json({ error: 'Unauthorized: No tenant context' });
            }

            // [VALIDATION] Zod Check
            const result = createAssetSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ error: 'Invalid asset data', details: result.error.issues });
            }

            const { name, parentId, description, criticality, status, code, rimeRisk, rimeImpact, rimeMaintenance, rimeEffort } = result.data as any;

            logger.info({ tenantId, name, code }, 'Creating new asset');

            const asset = await this.assetService.createAsset(
                tenantId,
                name,
                parentId || null,
                description,
                criticality as any,
                undefined, // imageUrl
                undefined, // lotoConfig
                code,
                status as any,
                rimeRisk,
                rimeImpact,
                rimeMaintenance,
                rimeEffort
            );

            logger.info({ assetId: asset.id, tenantId }, 'Asset created successfully');
            res.status(201).json(asset);
        } catch (error: any) {
            logger.error({ error, tenantId }, 'Failed to create asset');
            res.status(500).json({ error: error.message });
        }
    };

    update = async (req: Request, res: Response) => {
        const tenantId = getCurrentTenant()?.id;
        const { id } = req.params;
        try {
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });
            if (!id || id === 'undefined') return res.status(400).json({ error: 'Invalid Asset ID' });

            const data = { ...req.body };

            // Prevent updating read-only fields or tenantId
            delete data.id;
            delete data.tenantId;
            delete data.createdAt;
            delete data.updatedAt;

            logger.info({ assetId: id, tenantId }, 'Updating asset');

            const updated = await this.prisma.asset.update({
                where: { id, tenantId },
                data
            });

            res.json(updated);
        } catch (error: any) {
            logger.error({ error, assetId: id, tenantId }, 'Failed to update asset');
            res.status(500).json({ error: error.message });
        }
    };

    getTree = async (req: Request, res: Response) => {
        const tenantId = getCurrentTenant()?.id;
        const { id } = req.params;
        try {
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            const tree = await this.assetService.getAssetTree(id, tenantId);
            res.json(tree);
        } catch (error: any) {
            logger.error({ error, assetId: id, tenantId }, 'Failed to fetch asset tree');
            res.status(500).json({ error: error.message });
        }
    };

    importTemplate = async (req: Request, res: Response) => {
        const tenantId = getCurrentTenant()?.id;
        try {
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            const { template } = req.body;
            if (!template || !template.structure) {
                return res.status(400).json({ error: 'Template structure required' });
            }

            logger.info({ tenantId }, 'Importing asset template');
            await this.assetService.importTemplate(tenantId, template.structure);
            res.status(201).json({ message: 'Template imported successfully' });
        } catch (error: any) {
            logger.error({ error, tenantId }, 'Failed to import asset template');
            res.status(500).json({ error: 'Failed to import template' });
        }
    }

    bulkImport = async (req: Request, res: Response) => {
        const tenantId = getCurrentTenant()?.id;
        try {
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            const { text } = req.body;
            if (!text) return res.status(400).json({ error: 'DSL text is required' });

            logger.info({ tenantId }, 'Performing bulk asset import');
            const assets = await this.importerService.importBulk(tenantId, text);

            logger.info({ count: assets.length, tenantId }, 'Bulk import completed');
            res.status(201).json({
                message: `Successfully imported ${assets.length} root assets and their children.`,
                count: assets.length
            });
        } catch (error: any) {
            logger.error({ error, tenantId }, 'Bulk asset import failed');
            res.status(500).json({ error: error.message });
        }
    }

    getAll = async (req: Request, res: Response) => {
        const tenantId = getCurrentTenant()?.id;
        try {
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            const assets = await this.assetService.getAllAssets(tenantId);
            res.json(assets);
        } catch (error: any) {
            logger.error({ error, tenantId }, 'Failed to fetch all assets');
            res.status(500).json({ error: error.message });
        }
    };

    getById = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { id } = req.params;
        try {
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });
            if (!id || id === 'undefined') return res.status(400).json({ error: 'Invalid ID' });

            const asset = await this.assetService.getAssetById(id, tenantId);

            if (!asset) {
                return res.status(404).json({ error: 'Asset not found' });
            }

            res.json(asset);
        } catch (error: any) {
            logger.error({ error, assetId: id, tenantId }, 'Failed to fetch asset by ID');
            res.status(500).json({ error: error.message });
        }
    };

    delete = async (req: Request, res: Response) => {
        const tenantId = getCurrentTenant()?.id;
        const { id } = req.params;
        try {
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            const asset = await this.prisma.asset.findFirst({
                where: { id, tenantId }
            });

            if (!asset) return res.status(404).json({ error: 'Asset not found' });

            await this.prisma.asset.update({
                where: { id, tenantId },
                data: { deletedAt: new Date() }
            });

            logger.info({ assetId: id, tenantId }, 'Asset soft-deleted');
            res.status(204).send();
        } catch (error: any) {
            logger.error({ error, assetId: id, tenantId }, 'Failed to delete asset');
            res.status(500).json({ error: error.message });
        }
    };

    saveLayout = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            const { layout, scope } = req.body;
            const user = (req.session as any)?.user;
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            if (scope === 'user') {
                if (!hasPermission(req, 'asset:read')) return res.status(403).json({ error: 'Forbidden' });

                const currentUser = await this.prisma.user.findUnique({ where: { id: user.id } });
                const currentPrefs = ((currentUser as any)?.preferences) || {};
                const newPrefs = { ...currentPrefs, assetLayout: layout };

                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { preferences: newPrefs } as any
                });
                logger.info({ userId: user.id, tenantId }, 'User asset layout updated');
            } else if (scope === 'global') {
                if (!hasPermission(req, 'asset:write')) return res.status(403).json({ error: 'Forbidden' });

                await Promise.all(
                    Object.entries(layout).map(([assetId, pos]) =>
                        this.prisma.asset.update({
                            where: { id: assetId, tenantId: tenantId },
                            data: { metadata: { position: pos } } as any
                        })
                    )
                );
                logger.info({ tenantId }, 'Global asset layout updated');
            }

            res.status(200).json({ success: true });
        } catch (error: any) {
            logger.error({ error, tenantId }, 'Failed to save asset layout');
            res.status(500).json({ error: error.message });
        }
    };
}
