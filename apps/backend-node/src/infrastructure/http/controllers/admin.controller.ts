import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getCurrentTenant } from '../../middleware/tenant.middleware';

export class AdminController {
    constructor(private prisma: PrismaClient) { }

    updateBranding = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const { logoUrl, brandColor } = req.body;

            // Update Tenant via ID (resolved from Slug or Context)
            // Since we have multi-tenancy, we update the tenant matching the slug/ID.
            // Assuming tenantCtx has the real ID or we look it up.
            // Using Slug for lookup to be safe.
            const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            const updated = await this.prisma.tenant.update({
                where: { id: tenant.id },
                data: {
                    logoUrl: logoUrl, // undefined/nulls are handled by Prisma if omitted? No, need check?
                    // If undefined, it might not update. Use 'undefined' to skip.
                    brandColor: brandColor
                }
            });

            res.json(updated);
        } catch (error: any) {
            console.error('Update Branding Error:', error);
            res.status(500).json({ error: error.message });
        }
    };
}
