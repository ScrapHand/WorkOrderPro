import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { WorkOrderService } from '../../../application/services/work-order.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { PrismaClient } from '@prisma/client';
import { hasPermission } from '../../auth/rbac.utils';
import { createWorkOrderSchema, updateWorkOrderSchema } from '../../../application/validators/auth.validator';
import { logger } from '../../logging/logger';

export class WorkOrderController {
    constructor(
        private woService: WorkOrderService,
        private prisma: PrismaClient
    ) { }

    create = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const body = req.body;

        logger.info({ tenantId, body }, 'WorkOrder creation request received');

        try {
            if (!tenantCtx || !tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            // [VALIDATION] Zod Check
            const result = createWorkOrderSchema.safeParse(req.body);
            if (!result.success) {
                logger.warn({ issues: result.error.issues, tenantId }, 'WorkOrder validation failed');
                return res.status(400).json({ error: 'Invalid work order data', details: result.error.issues });
            }

            const { assetId, title, priority, description, assignedUserId, assignedToMe, provisionalAssetName } = result.data;
            const sessionUserId = (req.session as any)?.user?.id;

            // [LOGIC] Handle Provisional Asset
            let finalAssetId = assetId;
            if (!finalAssetId && provisionalAssetName) {
                logger.info({ provisionalAssetName, tenantId }, 'Creating Provisional Asset');
                const newAssetId = uuidv4();
                await this.prisma.asset.create({
                    data: {
                        id: newAssetId,
                        tenantId,
                        name: provisionalAssetName,
                        status: 'PENDING',
                        hierarchyPath: `/PENDING/${newAssetId}`,
                        criticality: 'C'
                    }
                });
                finalAssetId = newAssetId;
                logger.info({ assetId: finalAssetId }, 'Provisional Asset created');
            } else if (!finalAssetId) {
                return res.status(400).json({ error: 'Asset ID required' });
            }

            // [LOGIC] Handle Self-Assignment
            let targetUserId = assignedUserId;
            if (assignedToMe && sessionUserId) {
                targetUserId = sessionUserId;
            }

            logger.info({ assetId: finalAssetId, title, priority, targetUserId }, 'Calling WorkOrderService.createWorkOrder');

            const wo = await this.woService.createWorkOrder(
                tenantId,
                finalAssetId!,
                title,
                priority,
                description || undefined,
                targetUserId || undefined
            );

            logger.info({ workOrderId: wo.id, tenantId }, 'WorkOrder created successfully');

            // Explicitly return a clean object to avoid Prisma cycle issues if any
            res.status(201).json({
                id: wo.id,
                tenantId: wo.tenantId,
                assetId: wo.assetId,
                title: wo.title,
                status: wo.status,
                priority: wo.priority,
                rimeScore: wo.rimeScore
            });
        } catch (error: any) {
            logger.error({ error: error.message, stack: error.stack, tenantId }, 'WorkOrder creation failed with exception');
            res.status(500).json({ error: error.message || 'Internal Server Error' });
        }
    };

    getAll = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!tenantCtx || !tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            const filters = {
                status: (req.query.status as string)?.toUpperCase() || undefined,
                assetId: req.query.assetId as string | undefined,
                priority: (req.query.priority as string)?.toUpperCase() || undefined,
                rootAssetId: req.query.rootAssetId as string | undefined,
                from: req.query.from as string | undefined,
                to: req.query.to as string | undefined
            };

            const list = await this.woService.getWorkOrders(tenantId, filters);
            res.json(list);
        } catch (error: any) {
            logger.error({ error, tenantId }, 'Failed to fetch work orders');
            res.status(500).json({ error: error.message });
        }
    };

    getById = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!tenantCtx || !tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            const wo = await this.woService.getWorkOrderById(req.params.id, tenantId);
            if (!wo) return res.status(404).json({ error: 'Work order not found' });

            res.json(wo);
        } catch (error: any) {
            logger.error({ error, id: req.params.id, tenantId }, 'Failed to fetch work order by ID');
            res.status(500).json({ error: error.message });
        }
    };

    patch = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { id } = req.params;
        try {
            if (!tenantCtx || !tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            // [VALIDATION] Zod Check
            const result = updateWorkOrderSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ error: 'Invalid update data', details: result.error.issues });
            }

            const updates = result.data;

            const wo = await this.woService.updateWorkOrder(id, tenantId, updates);
            res.json(wo);
        } catch (error: any) {
            logger.error({ error, id, tenantId }, 'WorkOrder update failed');
            res.status(500).json({ error: error.message });
        }
    };

    delete = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { id } = req.params;
        try {
            if (!(req.session as any)?.user) return res.status(401).json({ error: 'Unauthorized: Please log in' });
            if (!hasPermission(req, 'work_order:delete')) return res.status(403).json({ error: 'Forbidden' });

            if (!tenantCtx || !tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            await this.woService.deleteWorkOrder(id, tenantId);
            logger.info({ id, tenantId }, 'WorkOrder deleted');
            res.status(204).send();
        } catch (error: any) {
            logger.error({ error, id, tenantId }, 'WorkOrder deletion failed');
            res.status(500).json({ error: error.message });
        }
    };

    verifySafety = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { id } = req.params;
        try {
            if (!tenantCtx || !tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            const wo = await this.woService.verifySafety(id, tenantId);
            res.json(wo);
        } catch (error: any) {
            logger.error({ error: error.message, id, tenantId }, 'Safety verification failed');
            res.status(500).json({ error: error.message });
        }
    };
}
