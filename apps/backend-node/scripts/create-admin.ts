import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Super Admin Restoration...');

    // 1. Ensure Global Tenant exists
    let tenant = await prisma.tenant.findFirst({
        where: { slug: 'system' }
    });

    if (!tenant) {
        console.log('Creating Global System Tenant...');
        tenant = await prisma.tenant.create({
            data: {
                name: 'Global System Tenant',
                slug: 'system',
                plan: 'ENTERPRISE',
                features: { factoryLayout: true, inventoryAlerts: true }
            }
        });
    }

    // 2. Hash Password
    const password = 'password123';
    const passwordHash = await argon2.hash(password);

    // 3. Upsert Super Admin User
    const adminEmail = 'admin@workorderpro.com';
    const user = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            passwordHash,
            role: 'SUPERADMIN',
            tenantId: tenant.id
        },
        create: {
            email: adminEmail,
            passwordHash,
            role: 'SUPERADMIN',
            tenantId: tenant.id,
            username: 'SuperAdmin'
        }
    });

    console.log(`✅ Super Admin ${adminEmail} restored successfully.`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🏢 Tenant Slug: ${tenant.slug}`);
}

main()
    .catch((e) => {
        console.error('❌ Error restoring admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
