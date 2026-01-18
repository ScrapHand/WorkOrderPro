import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreDefault() {
    console.log('🛠️ RESTORING DEFAULT TENANT...');

    // Check if it exists
    const existing = await prisma.tenant.findUnique({ where: { slug: 'default' } });
    if (existing) {
        console.log('✅ Default tenant already exists.');
        return;
    }

    // Create it
    await prisma.tenant.create({
        data: {
            id: 'default-tenant-id-001',
            slug: 'default',
            name: 'Default Organization',
            plan: 'enterprise',
            brandColor: '#000000'
        }
    });

    console.log('✅ Default tenant created.');
}

restoreDefault()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
