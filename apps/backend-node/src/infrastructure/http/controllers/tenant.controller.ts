import { Request, Response } from 'express';
import { TenantService } from '../../../application/services/tenant.service';
import { hasPermission } from '../../auth/rbac.utils';
import { createTenantSchema, updateTenantSchema } from '../../../application/validators/auth.validator';

export class TenantController {
    constructor(private service: TenantService) { }

    getAll = async (req: Request, res: Response) => {
        try {
            console.log('[TenantController] getAll called');
            const sessionUser = (req.session as any)?.user;
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

            // [FIX] BigInt Serialization (Prisma _count may return BigInt)
            const safeTenants = JSON.parse(JSON.stringify(tenants, (key, value) =>
                typeof value === 'bigint'
                    ? value.toString()
                    : value
            ));

            res.json(safeTenants);
        } catch (error) {
            console.error('List Tenants Error:', error);
            res.status(500).json({ error: 'Failed to list tenants' });
        }
    }

    create = async (req: Request, res: Response) => {
        try {
            // Only SUPER_ADMIN or GLOBAL_ADMIN should create tenants
            if (!hasPermission(req, 'tenant:write')) return res.status(403).json({ error: 'Forbidden' });

            // [VALIDATION] Zod Check
            const result = createTenantSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ error: 'Invalid tenant data', details: result.error.issues });
            }

            const { name, slug, adminEmail, maxUsers, maxAdmins } = result.data;

            const tenant = await this.service.create(name, slug, adminEmail, maxUsers, maxAdmins);
            res.status(201).json(tenant);
        } catch (error) {
            console.error('Create Tenant Error:', error);
            res.status(500).json({ error: 'Failed to create tenant' });
        }
    }

    seedDemo = async (req: Request, res: Response) => {
        try {
            // Demo seeding is a destructive/write op.
            const sessionUser = (req.session as any)?.user;
            const isMaster = ['SUPER_ADMIN', 'GLOBAL_ADMIN'].includes(sessionUser?.role);

            if (!isMaster && !hasPermission(req, 'tenant:write')) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            const { id } = req.params;
            await this.service.seedAstonManorDemo(id);
            res.json({ message: 'Demo data seeded successfully' });
        } catch (error) {
            console.error('Seed Demo Error:', error);
            res.status(500).json({ error: 'Failed to seed demo data' });
        }
    }

    update = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'tenant:write')) return res.status(403).json({ error: 'Forbidden' });

            const { id } = req.params;

            // [VALIDATION] Zod Check
            const result = updateTenantSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ error: 'Invalid update data', details: result.error.issues });
            }

            const tenant = await this.service.update(id, result.data);
            res.json(tenant);
        } catch (error) {
            console.error('Update Tenant Error:', error);
            res.status(500).json({ error: 'Failed to update tenant' });
        }
    }

    delete = async (req: Request, res: Response) => {
        try {
            if (!hasPermission(req, 'tenant:write')) return res.status(403).json({ error: 'Forbidden' });

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
