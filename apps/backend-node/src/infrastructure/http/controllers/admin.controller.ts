import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { logger } from '../../logging/logger';

export class AdminController {
    constructor(private prisma: PrismaClient) { }

    updateConfig = async (req: Request, res: Response, next: any) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!tenantCtx || !tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            const { branding, rbac, notifications, secrets } = req.body;
            const sessionUser = (req.session as any)?.user;

            logger.info({ tenantId, domains: { branding: !!branding, rbac: !!rbac, notifications: !!notifications, secrets: !!secrets } }, 'Tenant configuration update requested');

            // [SECURITY] RBAC & Secrets are Super-Admin ONLY
            if (rbac || secrets) {
                if (sessionUser?.role !== 'SUPER_ADMIN') {
                    logger.warn({ tenantId, userId: sessionUser?.id, role: sessionUser?.role }, 'Unauthorized attempt to update sensitive config');
                    return res.status(403).json({ error: 'Forbidden: Super Admin required for sensitive configuration' });
                }
            }

            // 1. Prepare Update Data
            const data: any = {};

            if (branding) {
                const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
                const existingConfig = (tenant?.brandingConfig as any) || {};

                // [NORMALIZE] Ensure all incoming keys are mapped correctly (handle snake_case vs camelCase)
                const normalizedBranding: any = {
                    primaryColor: branding.primaryColor || branding.primary_color || branding.brandColor || branding.brand_color,
                    secondaryColor: branding.secondaryColor || branding.secondary_color,
                    backgroundColor: branding.backgroundColor || branding.background_color,
                    textColor: branding.textColor || branding.text_color,
                    mutedColor: branding.mutedColor || branding.muted_color,
                    logoUrl: branding.logoUrl || branding.logo_url,
                    appName: branding.appName || branding.app_name || branding.name
                };

                // [FIX] Filter out undefined/null to prevent overwriting existing config with nothing
                Object.keys(normalizedBranding).forEach(key => {
                    if (normalizedBranding[key] === undefined || normalizedBranding[key] === null) {
                        delete normalizedBranding[key];
                    }
                });

                const newConfig = {
                    ...existingConfig,
                    ...normalizedBranding,
                    terminology: {
                        ...(existingConfig.terminology || {}),
                        ...(branding.terminology || {})
                    }
                };

                // Remove undefined fields from final object
                Object.keys(newConfig).forEach(key => (newConfig as any)[key] === undefined && delete (newConfig as any)[key]);

                data.brandingConfig = newConfig;

                // [SYNC] Always update top-level Tenant fields for legacy compatibility
                if (newConfig.primaryColor) data.brandColor = newConfig.primaryColor;
                if (newConfig.logoUrl) data.logoUrl = newConfig.logoUrl;
            }

            if (rbac) data.rbacConfig = rbac;
            if (notifications) data.notificationConfig = notifications;

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

            logger.info({ tenantId }, 'Tenant configuration updated successfully');
            res.json(updated);
        } catch (error: any) {
            logger.error({ error, tenantId }, 'Failed to update tenant configuration');
            next(error);
        }
    };

    updateEntitlements = async (req: Request, res: Response, next: any) => {
        const { id } = req.params; // Target Tenant ID
        try {
            const { plan, maxUsers, maxAdmins } = req.body;

            const updated = await this.prisma.tenant.update({
                where: { id },
                data: {
                    plan,
                    maxUsers,
                    maxAdmins
                }
            });

            logger.info({ targetTenantId: id }, 'Tenant entitlements updated');
            res.json(updated);
        } catch (error: any) {
            logger.error({ error, targetTenantId: id }, 'Failed to update tenant entitlements');
            next(error);
        }
    };

    getConfig = async (req: Request, res: Response, next: any) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!tenantCtx || !tenantId) return res.status(400).json({ error: 'Tenant context missing' });

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
                plan: tenant.plan,
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
            logger.error({ error, tenantId }, 'Failed to fetch tenant configuration');
            next(error);
        }
    };
}
