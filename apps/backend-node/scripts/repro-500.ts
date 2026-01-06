import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reproduce() {
    try {
        console.log('Resolving tenant "default"...');
        const tenant = await prisma.tenant.findUnique({
            where: { slug: 'default' }
        });

        if (!tenant) {
            console.error('Tenant "default" not found!');
            return;
        }

        console.log('Tenant Found:', tenant.slug);

        const t = tenant as any;
        const secrets = t.secretsConfig || {};
        const maskedSecrets: Record<string, string> = {};

        console.log('Masking secrets...');
        for (const [key, val] of Object.entries(secrets)) {
            if (typeof val === 'string' && val.length > 8) {
                maskedSecrets[key] = `${val.substring(0, 4)}****${val.substring(val.length - 4)}`;
            } else {
                maskedSecrets[key] = '********';
            }
        }

        console.log('Merging branding...');
        const dbBranding = t.brandingConfig || {};
        const mergedBranding = {
            ...dbBranding,
            primaryColor: dbBranding.primaryColor || tenant.brandColor,
            logoUrl: dbBranding.logoUrl || tenant.logoUrl,
        };

        console.log('Constructing response...');
        const response = {
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
        };

        console.log('SUCCESS:', JSON.stringify(response, null, 2));

    } catch (error: any) {
        console.error('REPRODUCTION ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

reproduce();
