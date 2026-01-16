import { Request, Response } from 'express';
import { ConveyorSystemService } from '../../../application/services/conveyor-system.service';
import { logger } from '../../logging/logger';

export class ConveyorSystemController {
    constructor(private conveyorService: ConveyorSystemService) { }

    /**
     * GET /api/conveyor-systems
     * List all conveyor systems for the tenant
     */
    listSystems = async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;
        const tenantId = sessionUser?.tenantId;
        try {
            if (!tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            logger.info({ tenantId }, 'Fetching all conveyor systems');
            const systems = await this.conveyorService.listSystems(tenantId);
            res.json(systems);
        } catch (error: any) {
            logger.error({ error, tenantId }, 'Failed to list conveyor systems');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * POST /api/conveyor-systems
     * Create a new conveyor system (TENANT_ADMIN only)
     */
    createSystem = async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;
        const tenantId = sessionUser?.tenantId;
        try {
            if (!tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // RBAC: Only TENANT_ADMIN can create systems
            if (sessionUser.role !== 'TENANT_ADMIN') {
                logger.warn({ userId: sessionUser.id, role: sessionUser.role, tenantId }, 'Unauthorized attempt to create conveyor system');
                return res.status(403).json({ error: 'Forbidden: Only TENANT_ADMIN can create systems' });
            }

            const { name, color, description } = req.body;

            if (!name || name.trim().length === 0) {
                return res.status(400).json({ error: 'System name is required' });
            }

            logger.info({ tenantId, name }, 'Creating new conveyor system');
            const system = await this.conveyorService.createSystem(tenantId, { name, color, description });

            logger.info({ systemId: system.id, tenantId }, 'Conveyor system created successfully');
            res.status(201).json(system);
        } catch (error: any) {
            logger.error({ error, tenantId }, 'Failed to create conveyor system');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * GET /api/conveyor-systems/:id
     * Get a specific conveyor system
     */
    getSystem = async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;
        const tenantId = sessionUser?.tenantId;
        const { id } = req.params;
        try {
            if (!tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            try {
                const system = await this.conveyorService.getSystem(id, tenantId);
                res.json(system);
            } catch (error: any) {
                if (error.message === 'Conveyor system not found') {
                    return res.status(404).json({ error: 'Conveyor system not found' });
                }
                throw error;
            }
        } catch (error: any) {
            logger.error({ error, systemId: id, tenantId }, 'Failed to get conveyor system');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * PATCH /api/conveyor-systems/:id
     * Update a conveyor system (TENANT_ADMIN only)
     */
    updateSystem = async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;
        const tenantId = sessionUser?.tenantId;
        const { id } = req.params;
        try {
            if (!tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // RBAC: Only TENANT_ADMIN can update systems
            if (sessionUser.role !== 'TENANT_ADMIN') {
                logger.warn({ userId: sessionUser.id, role: sessionUser.role, tenantId, systemId: id }, 'Unauthorized attempt to update conveyor system');
                return res.status(403).json({ error: 'Forbidden: Only TENANT_ADMIN can update systems' });
            }

            const { name, color, description } = req.body;

            try {
                logger.info({ systemId: id, tenantId }, 'Updating conveyor system');
                const system = await this.conveyorService.updateSystem(id, tenantId, { name, color, description });
                res.json(system);
            } catch (error: any) {
                if (error.message === 'Conveyor system not found') {
                    return res.status(404).json({ error: 'Conveyor system not found' });
                }
                throw error;
            }
        } catch (error: any) {
            logger.error({ error, systemId: id, tenantId }, 'Failed to update conveyor system');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * DELETE /api/conveyor-systems/:id
     * Delete a conveyor system (TENANT_ADMIN only)
     */
    deleteSystem = async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;
        const tenantId = sessionUser?.tenantId;
        const { id } = req.params;
        try {
            if (!tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // RBAC: Only TENANT_ADMIN can delete systems
            if (sessionUser.role !== 'TENANT_ADMIN') {
                logger.warn({ userId: sessionUser.id, role: sessionUser.role, tenantId, systemId: id }, 'Unauthorized attempt to delete conveyor system');
                return res.status(403).json({ error: 'Forbidden: Only TENANT_ADMIN can delete systems' });
            }

            try {
                logger.info({ systemId: id, tenantId }, 'Deleting conveyor system');
                await this.conveyorService.deleteSystem(id, tenantId);
                logger.info({ systemId: id, tenantId }, 'Conveyor system deleted successfully');
                res.status(204).send();
            } catch (error: any) {
                if (error.message === 'Conveyor system not found') {
                    return res.status(404).json({ error: 'Conveyor system not found' });
                }
                throw error;
            }
        } catch (error: any) {
            logger.error({ error, systemId: id, tenantId }, 'Failed to delete conveyor system');
            res.status(500).json({ error: error.message });
        }
    };
}
