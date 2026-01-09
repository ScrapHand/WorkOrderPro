import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create/Find Tenant
    const slug = 'default';
    let tenant = await prisma.tenant.findUnique({ where: { slug } });

    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                slug,
                name: 'Default Tenant',
                plan: 'pro',
                brandColor: '#2563eb', // Default Blue
                logoUrl: 'https://via.placeholder.com/150' // Placeholder
            }
        });
        console.log(`Created tenant: ${tenant.slug}`);
    } else {
        console.log(`Tenant '${slug}' already exists.`);
        // Ensure branding exists if upgrading schema
        if (!tenant.brandColor) {
            await prisma.tenant.update({
                where: { id: tenant.id },
                data: { brandColor: '#2563eb' }
            });
        }
    }

    // 1b. Create SuperAdmin User (GOD MODE)
    // Password: ScrapHandNcc1701bbc!
    const argon2 = require('argon2');
    const adminEmail = 'scraphand@admin.com';
    const adminPassword = 'ScrapHandNcc1701bbc!';
    const adminHash = await argon2.hash(adminPassword);

    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            role: 'SUPER_ADMIN',
            username: 'The Architect',
            passwordHash: adminHash
        },
        create: {
            email: adminEmail,
            passwordHash: adminHash,
            role: 'SUPER_ADMIN',
            username: 'The Architect',
            tenantId: tenant.id
        }
    });

    // 2. Create Asset Hierarchy
    // Root: Headquarters
    const hq = await prisma.asset.upsert({
        where: { id: 'hq-001' }, // Ensure ID consistency for re-runs using upsert if we had deterministic IDs, else create if not exists
        update: {},
        create: {
            id: 'hq-001',
            tenantId: tenant.id,
            name: 'Headquarters',
            description: 'Main Office and Plant',
            status: 'OPERATIONAL',
            criticality: 'B',
            hierarchyPath: 'hq-001'
        }
    });

    // Child: Main Utility Room
    const room = await prisma.asset.upsert({
        where: { id: 'room-101' },
        update: {},
        create: {
            id: 'room-101',
            tenantId: tenant.id,
            parentId: hq.id,
            name: 'Main Utility Room',
            description: 'Basement Level 1',
            status: 'OPERATIONAL',
            criticality: 'C',
            hierarchyPath: 'hq-001/room-101'
        }
    });

    // Grandchild: Generator
    const generator = await prisma.asset.upsert({
        where: { id: 'gen-x500' },
        update: {},
        create: {
            id: 'gen-x500',
            tenantId: tenant.id,
            parentId: room.id,
            name: 'Diesel Generator X500',
            description: 'Backup Power Source',
            status: 'OPERATIONAL', // Maybe DOWN?
            criticality: 'A',
            hierarchyPath: 'hq-001/room-101/gen-x500'
        }
    });
    console.log('Assets seeded.');

    // 3. Create Work Orders
    // WO 1: Priority repair on Generator
    await prisma.workOrder.create({
        data: {
            tenantId: tenant.id,
            assetId: generator.id,
            title: 'Monthly Inspection',
            description: 'Check fuel levels and voltage output.',
            status: 'OPEN',
            priority: 'HIGH',
            rimeScore: 70, // 10 * 7 (High)
        }
    });

    // WO 2: General Maintenance
    await prisma.workOrder.create({
        data: {
            tenantId: tenant.id,
            assetId: hq.id,
            title: 'Fix Lobby Door',
            description: 'Hinge is squeaking.',
            status: 'IN_PROGRESS',
            priority: 'LOW',
            rimeScore: 10, // 10 * 1 (Low)
        }
    });
    console.log('Work Orders seeded.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
