import { Request, Response } from 'express';
import { TenantService } from '../../../application/services/tenant.service';
import { hasPermission } from '../../auth/rbac.utils';
import { createTenantSchema, updateTenantSchema } from '../../../application/validators/auth.validator';
import { logger } from '../../logging/logger';

export class TenantController {
    constructor(private service: TenantService) { }

    getAll = async (req: Request, res: Response) => {
        try {
            const sessionUser = (req.session as any)?.user;

            // Security: SUPER_ADMIN, GLOBAL_ADMIN, or Default Admin
            const isMaster = ['SUPER_ADMIN', 'GLOBAL_ADMIN'].includes(sessionUser?.role);
            const isDefaultAdmin = sessionUser?.tenantSlug === 'default' && sessionUser?.role === 'ADMIN';

            logger.info({ userId: sessionUser?.id, role: sessionUser?.role, isMaster, isDefaultAdmin }, 'Fetching all tenants');

            if (!isMaster && !isDefaultAdmin) {
                logger.warn({ userId: sessionUser?.id }, 'Access denied to list all tenants');
                return res.status(403).json({ error: 'Access denied: Global admin privileges required' });
            }

            const tenants = await this.service.findAll();

            // [FIX] BigInt Serialization (Prisma _count may return BigInt)
            const safeTenants = JSON.parse(JSON.stringify(tenants, (key, value) =>
                typeof value === 'bigint'
                    ? value.toString()
                    : value
            ));

            res.json(safeTenants);
        } catch (error) {
            logger.error({ error }, 'Failed to list tenants');
            res.status(500).json({ error: 'Failed to list tenants' });
        }
    }

    create = async (req: Request, res: Response) => {
        try {
            // Only SUPER_ADMIN or GLOBAL_ADMIN should create tenants
            if (!hasPermission(req, 'tenant:write')) {
                logger.warn({ userId: (req.session as any)?.user?.id }, 'Unauthorized attempt to create tenant');
                return res.status(403).json({ error: 'Forbidden' });
            }

            // [VALIDATION] Zod Check
            const result = createTenantSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ error: 'Invalid tenant data', details: result.error.issues });
            }

            const { name, slug, adminEmail, maxUsers, maxAdmins } = result.data;
            logger.info({ name, slug, adminEmail }, 'Creating new tenant');

            const tenant = await this.service.create(name, slug, adminEmail, maxUsers, maxAdmins);

            logger.info({ tenantId: tenant.id, slug }, 'Tenant created successfully');
            res.status(201).json(tenant);
        } catch (error) {
            logger.error({ error }, 'Failed to create tenant');
            res.status(500).json({ error: 'Failed to create tenant' });
        }
    }

    seedDemo = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const sessionUser = (req.session as any)?.user;
            const isMaster = ['SUPER_ADMIN', 'GLOBAL_ADMIN'].includes(sessionUser?.role);

            if (!isMaster && !hasPermission(req, 'tenant:write')) {
                logger.warn({ userId: sessionUser?.id, tenantId: id }, 'Unauthorized attempt to seed demo data');
                return res.status(403).json({ error: 'Forbidden' });
            }

            logger.info({ tenantId: id }, 'Seeding demo data for tenant');
            await this.service.seedAstonManorDemo(id);

            logger.info({ tenantId: id }, 'Demo data seeded successfully');
            res.json({ message: 'Demo data seeded successfully' });
        } catch (error) {
            logger.error({ error, tenantId: id }, 'Failed to seed demo data');
            res.status(500).json({ error: 'Failed to seed demo data' });
        }
    }

    update = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            if (!hasPermission(req, 'tenant:write')) {
                logger.warn({ userId: (req.session as any)?.user?.id, tenantId: id }, 'Unauthorized attempt to update tenant');
                return res.status(403).json({ error: 'Forbidden' });
            }

            // [VALIDATION] Zod Check
            const result = updateTenantSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ error: 'Invalid update data', details: result.error.issues });
            }

            logger.info({ tenantId: id }, 'Updating tenant');
            const tenant = await this.service.update(id, result.data);

            res.json(tenant);
        } catch (error) {
            logger.error({ error, tenantId: id }, 'Failed to update tenant');
            res.status(500).json({ error: 'Failed to update tenant' });
        }
    }

    delete = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            if (!hasPermission(req, 'tenant:write')) {
                logger.warn({ userId: (req.session as any)?.user?.id, tenantId: id }, 'Unauthorized attempt to delete tenant');
                return res.status(403).json({ error: 'Forbidden' });
            }

            if (id === 'default') {
                return res.status(400).json({ error: 'Cannot delete the default tenant' });
            }

            logger.info({ tenantId: id }, 'Deleting tenant');
            await this.service.delete(id);

            logger.info({ tenantId: id }, 'Tenant deleted successfully');
            res.json({ message: 'Tenant deleted successfully' });
        } catch (error) {
            logger.error({ error, tenantId: id }, 'Failed to delete tenant');
            res.status(500).json({ error: 'Failed to delete tenant' });
        }
    }

    upgrade = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const sessionUser = (req.session as any)?.user;
            if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' });

            const { plan } = req.body;
            if (!['PRO', 'ENTERPRISE'].includes(plan)) {
                return res.status(400).json({ error: 'Invalid plan' });
            }

            // Only Tenant Admins or Master Admins can upgrade
            const isMaster = ['SUPER_ADMIN', 'GLOBAL_ADMIN'].includes(sessionUser.role);
            const isOwnTenant = sessionUser.tenantId === id;

            if (!isMaster && (!isOwnTenant || sessionUser.role !== 'TENANT_ADMIN')) {
                logger.warn({ userId: sessionUser.id, targetTenantId: id }, 'Unauthorized upgrade attempt');
                return res.status(403).json({ error: 'Forbidden' });
            }

            logger.info({ tenantId: id, plan }, 'Upgrading tenant plan');
            const updated = await this.service.upgrade(id, plan);

            logger.info({ tenantId: id, plan }, 'Tenant plan upgraded successfully');
            res.json(updated);
        } catch (error) {
            logger.error({ error, tenantId: id }, 'Failed to upgrade plan');
            res.status(500).json({ error: 'Failed to upgrade plan' });
        }
    }

    reseedRoles = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const sessionUser = (req.session as any)?.user;
            const isMaster = ['SUPER_ADMIN', 'GLOBAL_ADMIN'].includes(sessionUser?.role);

            if (!isMaster && !hasPermission(req, 'tenant:write')) {
                logger.warn({ userId: sessionUser?.id, tenantId: id }, 'Unauthorized attempt to reseed roles');
                return res.status(403).json({ error: 'Forbidden' });
            }

            logger.info({ tenantId: id }, 'Reseeding default roles for tenant');
            await this.service.reseedRoles(id);

            logger.info({ tenantId: id }, 'Roles reseeded successfully');
            res.json({ message: 'Roles reseeded successfully' });
        } catch (error) {
            logger.error({ error, tenantId: id }, 'Failed to reseed roles');
            res.status(500).json({ error: 'Failed to reseed roles' });
        }
    }
}
