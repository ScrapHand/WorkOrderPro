import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getCurrentTenant } from '../../middleware/tenant.middleware';

export class AdminController {
    constructor(private prisma: PrismaClient) { }

    updateConfig = async (req: Request, res: Response, next: any) => {
        try {
            console.log("AdminController.updateConfig: Body:", JSON.stringify(req.body, null, 2));
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });
            const tenantId = tenantCtx.id;

            const { branding, rbac, notifications, secrets } = req.body;

            // 1. Prepare Update Data
            const data: any = {};

            if (branding) {
                console.log("Updating Branding:", branding);

                // [HARSH MERGE] Ensure we don't lose existing branding config
                const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
                const existingConfig = (tenant?.brandingConfig as any) || {};

                const newConfig = {
                    ...existingConfig,
                    ...branding,
                    // Normalize standard keys
                    primaryColor: branding.primaryColor || branding.brandColor || existingConfig.primaryColor,
                    logoUrl: branding.logoUrl || existingConfig.logoUrl
                };

                data.brandingConfig = newConfig;

                // [Sync Legacy Fields] for robust compatibility with older components
                if (newConfig.primaryColor) data.brandColor = newConfig.primaryColor;
                if (newConfig.logoUrl) data.logoUrl = newConfig.logoUrl;
            }

            if (rbac) {
                data.rbacConfig = rbac;
            }

            if (notifications) {
                data.notificationConfig = notifications;
            }

            if (secrets) {
                const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } }) as any;
                const currentSecrets = (tenant?.secretsConfig as Record<string, any>) || {};
                data.secretsConfig = { ...currentSecrets, ...secrets };
            }

            // 2. Perform Update
            const updated = await this.prisma.tenant.update({
                where: { id: tenantId },
                data: data
            });

            console.log("Tenant Updated:", updated.brandingConfig);
            res.json(updated);
        } catch (error: any) {
            console.error('Update Config Error:', error);
            next(error);
        }
    };

    updateEntitlements = async (req: Request, res: Response, next: any) => {
        try {
            // Only SUPER_ADMIN allowed (This role check will be enforced at route level via middleware)
            const { id } = req.params; // Target Tenant ID
            const { plan, maxUsers, maxAdmins } = req.body;

            const updated = await this.prisma.tenant.update({
                where: { id },
                data: {
                    plan,
                    maxUsers,
                    maxAdmins
                }
            });

            res.json(updated);
        } catch (error: any) {
            console.error('Update Entitlements Error:', error);
            next(error);
        }
    };

    getConfig = async (req: Request, res: Response, next: any) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });
            const tenantId = tenantCtx.id;

            const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            // [SECURITY] Mask Secrets
            const t = tenant as any;
            const secrets = t.secretsConfig || {};
            const maskedSecrets: Record<string, string> = {};

            for (const [key, val] of Object.entries(secrets)) {
                if (typeof val === 'string' && val.length > 8) {
                    maskedSecrets[key] = `${val.substring(0, 4)}****${val.substring(val.length - 4)}`;
                } else {
                    maskedSecrets[key] = '********';
                }
            }

            // Robust Merging of Branding
            const dbBranding = t.brandingConfig || {};
            const mergedBranding = {
                ...dbBranding,
                primaryColor: dbBranding.primaryColor || tenant.brandColor,
                logoUrl: dbBranding.logoUrl || tenant.logoUrl,
            };

            res.json({
                slug: tenant.slug,
                name: tenant.name,
                branding: mergedBranding,
                rbac: t.rbacConfig || {},
                notifications: t.notificationConfig || {
                    enabled: true,
                    soundUrl: null,
                    volume: 0.5
                },
                secrets: maskedSecrets
            });
        } catch (error: any) {
            console.error('Get Config Error:', error);
            next(error);
        }
    };
}
