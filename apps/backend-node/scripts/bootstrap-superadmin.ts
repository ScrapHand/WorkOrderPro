import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function bootstrap() {
    console.log('🚀 CLEAN SLATE PROTOCOL: Truncating remote tables...');

    // Force wipe to ensure legacy accounts like admin@example.com are gone
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User", "Tenant", "Asset", "WorkOrder", "session", "Role" CASCADE;`);

    console.log('🚀 Bootstrapping Platform Super Admin...');

    // 1. Ensure System Tenant exists
    const systemTenant = await prisma.tenant.upsert({
        where: { slug: 'system' },
        update: {},
        create: {
            slug: 'system',
            name: 'Platform Systems',
            plan: 'enterprise',
            brandColor: '#4f46e5'
        }
    });

    // 2. Create/Update Super Admin
    const email = 'scraphand@admin.com';
    const password = 'ScrapHandNcc1701bbc!';
    const passwordHash = await argon2.hash(password);

    const admin = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash,
            role: 'SUPER_ADMIN',
            username: 'Platform Architect'
        },
        create: {
            email,
            passwordHash,
            role: 'SUPER_ADMIN',
            username: 'Platform Architect',
            tenantId: systemTenant.id
        }
    });

    console.log(`✅ Super Admin Established: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('--- CLEAN SLATE PROTOCOL COMPLETE ---');
}

bootstrap()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
