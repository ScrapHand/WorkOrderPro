import { Request, Response } from 'express';
import { FactoryLayoutService } from '../../../application/services/factory-layout.service';
import { logger } from '../../logging/logger';

export class FactoryLayoutController {
    constructor(private layoutService: FactoryLayoutService) { }

    /**
     * GET /api/factory-layouts
     * List all layouts for the tenant
     */
    listLayouts = async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;
        const tenantId = sessionUser?.tenantId;
        try {
            if (!tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const layouts = await this.layoutService.getLayouts(tenantId);
            res.json(layouts);
        } catch (error: any) {
            logger.error({ error, tenantId }, 'Failed to list layouts');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * POST /api/factory-layouts
     * Create a new layout (TENANT_ADMIN only)
     */
    createLayout = async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;
        const tenantId = sessionUser?.tenantId;
        try {
            if (!tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // RBAC: Only TENANT_ADMIN can create layouts
            if (sessionUser.role !== 'TENANT_ADMIN') {
                logger.warn({ userId: sessionUser.id, role: sessionUser.role, tenantId }, 'Unauthorized attempt to create factory layout');
                return res.status(403).json({ error: 'Forbidden: Only TENANT_ADMIN can create layouts' });
            }

            const { name, description } = req.body;

            if (!name || name.trim().length === 0) {
                return res.status(400).json({ error: 'Layout name is required' });
            }

            logger.info({ tenantId, name }, 'Creating new factory layout');
            const layout = await this.layoutService.createLayout(tenantId, { name, description });

            logger.info({ layoutId: layout.id, tenantId }, 'Factory layout created successfully');
            res.status(201).json(layout);
        } catch (error: any) {
            logger.error({ error, tenantId }, 'Failed to create factory layout');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * GET /api/factory-layouts/:id
     * Get a specific layout with all nodes and edges
     */
    getLayout = async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;
        const tenantId = sessionUser?.tenantId;
        const { id } = req.params;
        try {
            if (!tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            try {
                const layout = await this.layoutService.getLayout(id, tenantId);
                res.json(layout);
            } catch (error: any) {
                if (error.message === 'Layout not found') {
                    return res.status(404).json({ error: 'Layout not found' });
                }
                throw error;
            }
        } catch (error: any) {
            logger.error({ error, layoutId: id, tenantId }, 'Failed to get factory layout');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * PATCH /api/factory-layouts/:id
     * Update layout metadata (TENANT_ADMIN only)
     */
    updateMetadata = async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;
        const tenantId = sessionUser?.tenantId;
        const { id } = req.params;
        try {
            if (!tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // RBAC: Only TENANT_ADMIN can update layouts
            if (sessionUser.role !== 'TENANT_ADMIN') {
                logger.warn({ userId: sessionUser.id, role: sessionUser.role, tenantId, layoutId: id }, 'Unauthorized attempt to update factory layout metadata');
                return res.status(403).json({ error: 'Forbidden: Only TENANT_ADMIN can update layouts' });
            }

            const { name, description, viewportJson } = req.body;

            try {
                logger.info({ layoutId: id, tenantId }, 'Updating factory layout metadata');
                const layout = await this.layoutService.updateLayoutMetadata(id, tenantId, {
                    name,
                    description,
                    viewportJson
                });
                res.json(layout);
            } catch (error: any) {
                if (error.message === 'Layout not found') {
                    return res.status(404).json({ error: 'Layout not found' });
                }
                if (error.message === 'Cannot modify locked layout') {
                    return res.status(403).json({ error: 'Cannot modify locked layout' });
                }
                throw error;
            }
        } catch (error: any) {
            logger.error({ error, layoutId: id, tenantId }, 'Failed to update factory layout metadata');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * PUT /api/factory-layouts/:id/graph
     * Bulk save graph state (nodes and edges) - TENANT_ADMIN only
     */
    bulkSaveGraph = async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;
        const tenantId = sessionUser?.tenantId;
        const { id } = req.params;
        try {
            if (!tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // RBAC: Only TENANT_ADMIN can update graph
            if (sessionUser.role !== 'TENANT_ADMIN') {
                logger.warn({ userId: sessionUser.id, role: sessionUser.role, tenantId, layoutId: id }, 'Unauthorized attempt to update factory layout graph');
                return res.status(403).json({ error: 'Forbidden: Only TENANT_ADMIN can update graph' });
            }

            const { version, nodes, edges } = req.body;

            if (version === undefined || !Array.isArray(nodes) || !Array.isArray(edges)) {
                return res.status(400).json({ error: 'Invalid request: version, nodes, and edges are required' });
            }

            try {
                logger.info({ layoutId: id, tenantId, nodeCount: nodes.length, edgeCount: edges.length }, 'Saving factory layout graph');
                const layout = await this.layoutService.bulkSaveGraph(id, tenantId, { version, nodes, edges });
                res.json(layout);
            } catch (error: any) {
                if (error.message === 'Layout not found') {
                    return res.status(404).json({ error: 'Layout not found' });
                }
                if (error.message.includes('modified by another user')) {
                    return res.status(409).json({ error: error.message });
                }
                if (error.message === 'Cannot modify locked layout') {
                    return res.status(403).json({ error: 'Cannot modify locked layout' });
                }
                if (error.message === 'Invalid asset references detected') {
                    return res.status(400).json({ error: 'Invalid asset references detected' });
                }
                throw error;
            }
        } catch (error: any) {
            logger.error({ error, layoutId: id, tenantId }, 'Failed to bulk save factory layout graph');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * POST /api/factory-layouts/:id/lock
     * Toggle lock state (TENANT_ADMIN only)
     */
    toggleLock = async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;
        const tenantId = sessionUser?.tenantId;
        const { id } = req.params;
        try {
            if (!tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // RBAC: Only TENANT_ADMIN can toggle lock
            if (sessionUser.role !== 'TENANT_ADMIN') {
                logger.warn({ userId: sessionUser.id, role: sessionUser.role, tenantId, layoutId: id }, 'Unauthorized attempt to toggle factory layout lock');
                return res.status(403).json({ error: 'Forbidden: Only TENANT_ADMIN can toggle lock' });
            }

            try {
                logger.info({ layoutId: id, tenantId }, 'Toggling factory layout lock');
                const layout = await this.layoutService.toggleLock(id, tenantId);
                res.json(layout);
            } catch (error: any) {
                if (error.message === 'Layout not found') {
                    return res.status(404).json({ error: 'Layout not found' });
                }
                throw error;
            }
        } catch (error: any) {
            logger.error({ error, layoutId: id, tenantId }, 'Failed to toggle factory layout lock');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * DELETE /api/factory-layouts/:id
     * Delete a layout (TENANT_ADMIN only)
     */
    deleteLayout = async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;
        const tenantId = sessionUser?.tenantId;
        const { id } = req.params;
        try {
            if (!tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // RBAC: Only TENANT_ADMIN can delete layouts
            if (sessionUser.role !== 'TENANT_ADMIN') {
                logger.warn({ userId: sessionUser.id, role: sessionUser.role, tenantId, layoutId: id }, 'Unauthorized attempt to delete factory layout');
                return res.status(403).json({ error: 'Forbidden: Only TENANT_ADMIN can delete layouts' });
            }

            try {
                logger.info({ layoutId: id, tenantId }, 'Deleting factory layout');
                await this.layoutService.deleteLayout(id, tenantId);
                logger.info({ layoutId: id, tenantId }, 'Factory layout deleted successfully');
                res.status(204).send();
            } catch (error: any) {
                if (error.message === 'Layout not found') {
                    return res.status(404).json({ error: 'Layout not found' });
                }
                throw error;
            }
        } catch (error: any) {
            logger.error({ error, layoutId: id, tenantId }, 'Failed to delete factory layout');
            res.status(500).json({ error: error.message });
        }
    };
}
