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

            const { branding, rbac } = req.body;
            // Expecting: { branding: { primaryColor, ... }, rbac: { "ROLE": ... } }

            // 1. Resolve Tenant
            const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } }) as any;
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            // 2. Prepare Update Data
            const data: any = {};

            if (branding) {
                console.log("Updating Branding:", branding);
                data.brandingConfig = branding;
                // [Sync Legacy Fields]
                if (branding.primaryColor) data.brandColor = branding.primaryColor;
                if (branding.logoUrl) data.logoUrl = branding.logoUrl;
            }

            if (rbac) {
                data.rbacConfig = rbac;
            }

            if (req.body.notifications) {
                data.notificationConfig = req.body.notifications;
            }

            if (req.body.secrets) {
                const currentSecrets = (tenant.secretsConfig as any) || {};
                data.secretsConfig = { ...currentSecrets, ...req.body.secrets };
            }

            // 3. Perform Update
            const updated = await this.prisma.tenant.update({
                where: { id: tenant.id },
                data: data
            });

            console.log("Tenant Updated:", updated.brandingConfig);
            res.json(updated);
        } catch (error: any) {
            console.error('Update Config Error:', error);
            next(error);
        }
    };

    getConfig = async (req: Request, res: Response, next: any) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
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

            console.log("AdminController.getConfig: Merged Branding:", mergedBranding);

            // Return safe public config
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
