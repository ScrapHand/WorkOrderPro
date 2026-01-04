import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

console.log('--- SEED V2 STARTING ---');

const possiblePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env'),
];

let loaded = false;
for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        console.log(`Found .env at: ${p}`);
        const result = dotenv.config({ path: p });
        if (result.error) {
            console.error(`Error loading ${p}:`, result.error);
        } else {
            console.log(`Loaded ${p}`);
            // Check if DATABASE_URL is now present
            if (process.env.DATABASE_URL) {
                console.log('DATABASE_URL found in env.');
                loaded = true;
                break;
            } else {
                console.log('Loaded file but DATABASE_URL missing.');
            }
        }
    }
}

if (!loaded && !process.env.DATABASE_URL) {
    // Last ditch: manual parse if dotenv failed explicitly
    console.log('Attempting manual parsing...');
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            try {
                const content = fs.readFileSync(p, 'utf-8');
                const match = content.match(/DATABASE_URL=["']?(.*?)["']?$/m);
                if (match) {
                    process.env.DATABASE_URL = match[1];
                    console.log('Manual parse extracted DATABASE_URL');
                    loaded = true;
                    break;
                }
            } catch (e) { console.error(e) }
        }
    }
}

if (!process.env.DATABASE_URL) {
    console.error('FATAL: DATABASE_URL not found.');
    process.exit(1);
}

// Seeding Logic
const DEFAULT_ROLES = {
    ADMIN: [
        'work_order:read', 'work_order:write', 'work_order:delete',
        'asset:read', 'asset:write', 'asset:delete',
        'inventory:read', 'inventory:write', 'inventory:delete',
        'user:read', 'user:write', 'user:delete',
        'tenant:write', 'report:read'
    ],
    MANAGER: [
        'work_order:read', 'work_order:write',
        'asset:read', 'asset:write',
        'inventory:read', 'inventory:write',
        'user:read',
        'report:read'
    ],
    TECHNICIAN: [
        'work_order:read', 'work_order:write',
        'asset:read',
        'inventory:read'
    ],
    VIEWER: [
        'work_order:read',
        'asset:read',
        'inventory:read'
    ]
};

async function main() {
    console.log('Importing PrismaClient...');
    const { PrismaClient } = await import('@prisma/client');
    console.log('Instantiating Prisma with explicit URL...');
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });

    try {
        console.log('Connecting...');
        let tenants = await prisma.tenant.findMany();
        if (tenants.length === 0) {
            console.log('No tenants found. Creating default tenant...');
            const defaultTenant = await prisma.tenant.create({
                data: {
                    name: 'Default Organization',
                    slug: 'default',
                    plan: 'ENTERPRISE'
                }
            });
            tenants = [defaultTenant];
        }
        console.log(`Found ${tenants.length} tenants.`);

        // [NEW] Ensure Admin User Exists
        const adminEmail = 'admin@example.com';
        const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

        if (!existingAdmin) {
            console.log('Admin user missing. Creating default admin...');
            // Need bcrypt to hash password
            const bcrypt = await import('bcryptjs');
            const hashedPassword = await bcrypt.hash('ScrapHand', 10);

            await prisma.user.create({
                data: {
                    email: adminEmail,
                    passwordHash: hashedPassword,
                    username: 'System Admin',
                    role: 'ADMIN', // Using the Enum directly on User model as fallback/primary
                    tenantId: tenants[0].id
                }
            });
            console.log('Default admin created: admin@example.com / ScrapHand');
        }

        for (const tenant of tenants) {
            console.log(`Seeding roles for: ${tenant.slug}`);
            for (const [roleName, permissions] of Object.entries(DEFAULT_ROLES)) {
                await (prisma as any).role.upsert({
                    where: {
                        tenantId_name: {
                            tenantId: tenant.id,
                            name: roleName
                        }
                    },
                    update: {
                        permissions: permissions,
                        isSystem: true
                    },
                    create: {
                        tenantId: tenant.id,
                        name: roleName,
                        description: `Default ${roleName} role`,
                        permissions: permissions,
                        isSystem: true
                    }
                });
            }
        }
        console.log('Done.');
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
