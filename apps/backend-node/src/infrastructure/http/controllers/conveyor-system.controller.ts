import { Request, Response } from 'express';
import { ConveyorSystemService } from '../../../application/services/conveyor-system.service';

export class ConveyorSystemController {
    constructor(private conveyorService: ConveyorSystemService) { }

    /**
     * GET /api/conveyor-systems
     * List all conveyor systems for the tenant
     */
    listSystems = async (req: Request, res: Response) => {
        try {
            const sessionUser = (req.session as any)?.user;
            if (!sessionUser?.tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const tenantId = sessionUser.tenantId;

            const systems = await this.conveyorService.listSystems(tenantId);
            res.json(systems);
        } catch (error: any) {
            console.error('List Conveyor Systems Error:', error);
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * POST /api/conveyor-systems
     * Create a new conveyor system (TENANT_ADMIN only)
     */
    createSystem = async (req: Request, res: Response) => {
        try {
            const sessionUser = (req.session as any)?.user;
            if (!sessionUser?.tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const tenantId = sessionUser.tenantId;

            // RBAC: Only TENANT_ADMIN can create systems
            if (sessionUser.role !== 'TENANT_ADMIN') {
                return res.status(403).json({ error: 'Forbidden: Only TENANT_ADMIN can create systems' });
            }

            const { name, color, description } = req.body;

            if (!name || name.trim().length === 0) {
                return res.status(400).json({ error: 'System name is required' });
            }

            const system = await this.conveyorService.createSystem(tenantId, { name, color, description });
            res.status(201).json(system);
        } catch (error: any) {
            console.error('Create Conveyor System Error:', error);
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * GET /api/conveyor-systems/:id
     * Get a specific conveyor system
     */
    getSystem = async (req: Request, res: Response) => {
        try {
            const sessionUser = (req.session as any)?.user;
            if (!sessionUser?.tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const tenantId = sessionUser.tenantId;

            const { id } = req.params;

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
            console.error('Get Conveyor System Error:', error);
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * PATCH /api/conveyor-systems/:id
     * Update a conveyor system (TENANT_ADMIN only)
     */
    updateSystem = async (req: Request, res: Response) => {
        try {
            const sessionUser = (req.session as any)?.user;
            if (!sessionUser?.tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const tenantId = sessionUser.tenantId;

            // RBAC: Only TENANT_ADMIN can update systems
            if (sessionUser.role !== 'TENANT_ADMIN') {
                return res.status(403).json({ error: 'Forbidden: Only TENANT_ADMIN can update systems' });
            }

            const { id } = req.params;
            const { name, color, description } = req.body;

            try {
                const system = await this.conveyorService.updateSystem(id, tenantId, { name, color, description });
                res.json(system);
            } catch (error: any) {
                if (error.message === 'Conveyor system not found') {
                    return res.status(404).json({ error: 'Conveyor system not found' });
                }
                throw error;
            }
        } catch (error: any) {
            console.error('Update Conveyor System Error:', error);
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * DELETE /api/conveyor-systems/:id
     * Delete a conveyor system (TENANT_ADMIN only)
     */
    deleteSystem = async (req: Request, res: Response) => {
        try {
            const sessionUser = (req.session as any)?.user;
            if (!sessionUser?.tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const tenantId = sessionUser.tenantId;

            // RBAC: Only TENANT_ADMIN can delete systems
            if (sessionUser.role !== 'TENANT_ADMIN') {
                return res.status(403).json({ error: 'Forbidden: Only TENANT_ADMIN can delete systems' });
            }

            const { id } = req.params;

            try {
                await this.conveyorService.deleteSystem(id, tenantId);
                res.status(204).send();
            } catch (error: any) {
                if (error.message === 'Conveyor system not found') {
                    return res.status(404).json({ error: 'Conveyor system not found' });
                }
                throw error;
            }
        } catch (error: any) {
            console.error('Delete Conveyor System Error:', error);
            res.status(500).json({ error: error.message });
        }
    };
}
