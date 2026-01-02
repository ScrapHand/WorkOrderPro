import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getCurrentTenant } from '../../middleware/tenant.middleware';

export class AdminController {
    constructor(private prisma: PrismaClient) { }

    updateConfig = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const { branding, rbac } = req.body;
            // Expecting: { branding: { primaryColor, ... }, rbac: { "ROLE": ... } }

            // 1. Resolve Tenant
            const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantCtx.slug } });
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            // 2. Prepare Update Data
            const data: any = {};

            if (branding) {
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
                // [SECURITY] We might want to encrypt here, but for now we store as JSON.
                // In a real app, use AES-256 before saving to DB.
                // Merging logic: We need to merge with existing if partial update?
                // For now, assume full replacement or frontend handles merge.
                // Let's do a smart merge serverside.
                const currentSecrets = (tenant.secretsConfig as any) || {};
                data.secretsConfig = { ...currentSecrets, ...req.body.secrets };
            }

            // 3. Perform Update
            const updated = await this.prisma.tenant.update({
                where: { id: tenant.id },
                data: data
            });

            res.json(updated);
        } catch (error: any) {
            console.error('Update Config Error:', error);
            res.status(500).json({ error: error.message });
        }
    };

    getConfig = async (req: Request, res: Response) => {
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

            // Return safe public config
            res.json({
                slug: tenant.slug,
                name: tenant.name,
                branding: t.brandingConfig || {
                    primaryColor: tenant.brandColor,
                    logoUrl: tenant.logoUrl
                },
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
            res.status(500).json({ error: error.message });
        }
    };
}
