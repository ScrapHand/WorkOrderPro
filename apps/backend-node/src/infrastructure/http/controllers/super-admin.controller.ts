
import { Request, Response } from 'express';
import { SuperAdminService } from '../../../application/services/super-admin.service';
import { logger } from '../../logging/logger';

export class SuperAdminController {
    constructor(private saService: SuperAdminService) { }

    getStats = async (req: Request, res: Response) => {
        try {
            const stats = await this.saService.getGlobalStats();
            res.json(stats);
        } catch (error: any) {
            logger.error({ error: error.message }, 'Failed to fetch global stats');
            res.status(500).json({ error: error.message });
        }
    };

    getTenants = async (req: Request, res: Response) => {
        try {
            const tenants = await this.saService.listTenants();
            res.json(tenants);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    provision = async (req: Request, res: Response) => {
        const { id } = req.params; // tenantId
        const { features } = req.body;
        const adminId = (req.session as any)?.user?.id;

        try {
            if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

            const tenant = await this.saService.provisionTenant(adminId, id, features);
            res.json(tenant);
        } catch (error: any) {
            logger.error({ error: error.message, tenantId: id }, 'Provisioning failed');
            res.status(500).json({ error: error.message });
        }
    };

    getLogs = async (req: Request, res: Response) => {
        try {
            const logs = await this.saService.getPlatformLogs();
            res.json(logs);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getUsers = async (req: Request, res: Response) => {
        const { search } = req.query;
        try {
            const users = await this.saService.listUsers(search as string);
            res.json(users);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    deleteUser = async (req: Request, res: Response) => {
        const { id } = req.params;
        const adminId = (req.session as any)?.user?.id;
        try {
            if (!adminId) return res.status(401).json({ error: 'Unauthorized' });
            await this.saService.deleteUser(adminId, id);
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
