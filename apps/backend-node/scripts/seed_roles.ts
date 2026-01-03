import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

console.log('--- SEED SCRIPT STARTING ---');

// 1. Robust Environment Loading (Copied from working debug_env.ts)
const possiblePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../.env'),
];

let loaded = false;
for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        console.log(`Found .env at: ${p}`);
        const result = dotenv.config({ path: p });

        if (result.error) {
            console.warn(`Error using dotenv on ${p}:`, result.error);
        } else {
            // Check if it actually loaded anything
            if (Object.keys(result.parsed || {}).length > 0) {
                console.log(`Successfully loaded .env with dotenv.`);
                loaded = true;
                break;
            } else {
                console.warn(`dotenv loaded ${p} but parsed 0 keys. Trying manual match.`);
            }
        }

        // Manual Fallback if dotenv fails (e.g. strict parsing issues)
        try {
            const content = fs.readFileSync(p, 'utf-8');
            content.split(/\r?\n/).forEach(line => {
                const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
                if (match) {
                    const key = match[1];
                    let val = match[2] || '';
                    // Strip quotes
                    val = val.replace(/^["'](.*)["']$/, '$1').trim();
                    if (!process.env[key]) {
                        process.env[key] = val;
                    }
                }
            });
            console.log('Manual parsing completed.');
            loaded = true;
            break;
        } catch (e) {
            console.error('Manual parse failed:', e);
        }
    }
}

if (!process.env.DATABASE_URL) {
    console.error('FATAL: DATABASE_URL is missing from process.env after all attempts.');
    process.exit(1);
} else {
    console.log('DATABASE_URL verified present.');
}

const DEFAULT_ROLES = {
    ADMIN: [
        'work_order:read', 'work_order:write', 'work_order:delete', 'work_order:archive',
        'asset:read', 'asset:write', 'asset:delete', 'asset:specs', 'asset:tree',
        'inventory:read', 'inventory:write', 'inventory:delete',
        'user:read', 'user:write', 'user:delete',
        'tenant:write', 'tenant:manage', 'report:read'
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
    // Dynamic import to allow env vars to settle
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
        console.log('Connecting to database...');
        const tenants = await prisma.tenant.findMany();
        console.log(`Found ${tenants.length} tenants.`);

        for (const tenant of tenants) {
            console.log(`Seeding roles for tenant: ${tenant.slug}`);
            for (const [roleName, permissions] of Object.entries(DEFAULT_ROLES)) {
                // Using (prisma as any) or specific type assertion if needed.
                // But dynamic import might lose type info, so casting is safe for script.
                const roleDelegate = (prisma as any).role;

                await roleDelegate.upsert({
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
            console.log(`Roles seeded for ${tenant.slug}`);
        }
        console.log('Seeding completed successfully.');
    } catch (e) {
        console.error('Seeding logic failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
