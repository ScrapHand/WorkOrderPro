import { Request, Response } from 'express';
import { AssetService } from '../../../application/services/asset.service';
import { AssetImporterService } from '../../../application/services/asset-importer.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { PrismaClient } from '@prisma/client';
import { hasPermission } from '../../auth/rbac.utils';
import { createAssetSchema } from '../../../application/validators/auth.validator';

export class AssetController {
    constructor(
        private assetService: AssetService,
        private importerService: AssetImporterService,
        private prisma: PrismaClient
    ) { }

    create = async (req: Request, res: Response) => {
        try {
            // SECURITY: derive tenantId ONLY from secure session.
            const sessionUser = (req.session as any)?.user;
            if (!sessionUser?.tenantId) {
                return res.status(401).json({ error: 'Unauthorized: No tenant context' });
            }
            const tenantId = sessionUser.tenantId;

            // [VALIDATION] Zod Check
            const result = createAssetSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ error: 'Invalid asset data', details: result.error.issues });
            }

            const { name, parentId, description, criticality, status, code, rimeRisk, rimeImpact, rimeMaintenance, rimeEffort } = result.data as any;

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

            res.status(201).json(asset);
        } catch (error: any) {
            console.error('Create Asset Error:', error);
            res.status(500).json({ error: error.message });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const sessionUser = (req.session as any)?.user;
            if (!sessionUser?.tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const tenantId = sessionUser.tenantId;

            const { id } = req.params;
            if (!id || id === 'undefined') {
                return res.status(400).json({ error: 'Invalid Asset ID' });
            }
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
            const sessionUser = (req.session as any)?.user;
            if (!sessionUser?.tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const tenantId = sessionUser.tenantId;

            const { id } = req.params;
            const tree = await this.assetService.getAssetTree(id, tenantId);
            res.json(tree);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    importTemplate = async (req: Request, res: Response) => {
        try {
            const { tenantId } = (req.session as any).user;
            const { template } = req.body;
            if (!template || !template.structure) {
                return res.status(400).json({ error: 'Template structure required' });
            }
            await this.assetService.importTemplate(tenantId, template.structure);
            res.status(201).json({ message: 'Template imported successfully' });
        } catch (error: any) {
            console.error('Import Template Error:', error);
            res.status(500).json({ error: 'Failed to import template' });
        }
    }

    bulkImport = async (req: Request, res: Response) => {
        try {
            const sessionUser = (req.session as any)?.user;
            if (!sessionUser?.tenantId) return res.status(401).json({ error: 'Unauthorized' });

            const { text } = req.body;
            if (!text) return res.status(400).json({ error: 'DSL text is required' });

            const assets = await this.importerService.importBulk(sessionUser.tenantId, text);
            res.status(201).json({
                message: `Successfully imported ${assets.length} root assets and their children.`,
                count: assets.length
            });
        } catch (error: any) {
            console.error('Bulk Import Error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    getAll = async (req: Request, res: Response) => {
        try {
            const sessionUser = (req.session as any)?.user;
            if (!sessionUser?.tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const tenantId = sessionUser.tenantId;

            const assets = await this.assetService.getAllAssets(tenantId);
            res.json(assets);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getById = async (req: Request, res: Response) => {
        try {
            console.log(`[Asset] getById: ${req.params.id}`); // [DEBUG]
            const ctx = getCurrentTenant();
            if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

            const { id } = req.params;
            if (!id || id === 'undefined') return res.status(400).json({ error: 'Invalid ID' });

            const asset = await this.assetService.getAssetById(id, ctx.id);

            if (!asset) {
                return res.status(404).json({ error: 'Asset not found' });
            }

            res.json(asset);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            const sessionUser = (req.session as any)?.user;
            if (!sessionUser?.tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const tenantId = sessionUser.tenantId;

            const { id } = req.params;
            const asset = await this.prisma.asset.findFirst({
                where: { id, tenantId }
            });

            if (!asset) return res.status(404).json({ error: 'Asset not found' });

            await this.prisma.asset.update({
                where: { id, tenantId },
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
            const user = (req.session as any)?.user;
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            if (scope === 'user') {
                // User-scoped preference is always allowed if logged in (effectively asset:read context)
                if (!hasPermission(req, 'asset:read')) return res.status(403).json({ error: 'Forbidden' });

                const currentUser = await this.prisma.user.findUnique({ where: { id: user.id } });
                const currentPrefs = ((currentUser as any)?.preferences) || {};
                const newPrefs = { ...currentPrefs, assetLayout: layout };

                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { preferences: newPrefs } as any
                });
            } else if (scope === 'global') {
                // Global layout requires write permissions
                if (!hasPermission(req, 'asset:write')) return res.status(403).json({ error: 'Forbidden' });

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
