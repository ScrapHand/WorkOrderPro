import { Request, Response } from 'express';
import { TenantService } from '../../../application/services/tenant.service';

export class TenantController {
    constructor(private service: TenantService) { }

    getAll = async (req: Request, res: Response) => {
        try {
            console.log('[TenantController] getAll called');
            const sessionUser = (req.session as any).user;
            console.log('[TenantController] Session:', JSON.stringify(sessionUser));

            // Security: SUPER_ADMIN, GLOBAL_ADMIN, or Default Admin
            const isMaster = ['SUPER_ADMIN', 'GLOBAL_ADMIN'].includes(sessionUser?.role);
            const isDefaultAdmin = sessionUser?.tenantSlug === 'default' && sessionUser?.role === 'ADMIN';

            console.log(`[TenantController] Access Check: isMaster=${isMaster}, isDefault=${isDefaultAdmin}`);

            if (!isMaster && !isDefaultAdmin) {
                console.log('[TenantController] Access Denied');
                return res.status(403).json({ error: 'Access denied: Global admin privileges required' });
            }

            console.log('[TenantController] Calling Service.findAll...');
            const tenants = await this.service.findAll();
            console.log(`[TenantController] Fetched ${tenants.length} tenants. Sending response.`);

            res.json(tenants);
        } catch (error) {
            console.error('List Tenants Error:', error);
            res.status(500).json({ error: 'Failed to list tenants' });
        }
    }

    create = async (req: Request, res: Response) => {
        try {
            const { name, slug, adminEmail } = req.body;
            if (!name || !slug || !adminEmail) {
                return res.status(400).json({ error: 'Name, slug, and adminEmail are required' });
            }
            // Optional: check for existing slug

            const tenant = await this.service.create(name, slug, adminEmail);
            res.status(201).json(tenant);
        } catch (error) {
            console.error('Create Tenant Error:', error);
            res.status(500).json({ error: 'Failed to create tenant' });
        }
    }

    seedDemo = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await this.service.seedAstonManorDemo(id);
            res.json({ message: 'Demo data seeded successfully' });
        } catch (error) {
            console.error('Seed Demo Error:', error);
            res.status(500).json({ error: 'Failed to seed demo data' });
        }
    }

    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            if (id === 'default') {
                return res.status(400).json({ error: 'Cannot delete the default tenant' });
            }
            await this.service.delete(id);
            res.json({ message: 'Tenant deleted successfully' });
        } catch (error) {
            console.error('Delete Tenant Error:', error);
            res.status(500).json({ error: 'Failed to delete tenant' });
        }
    }
}
