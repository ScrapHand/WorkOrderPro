import { Request, Response } from 'express';
import { TenantService } from '../../../application/services/tenant.service';

export class TenantController {
    constructor(private service: TenantService) { }

    getAll = async (req: Request, res: Response) => {
        try {
            const tenants = await this.service.findAll();
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
