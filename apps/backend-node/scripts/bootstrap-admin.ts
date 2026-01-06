import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import 'dotenv/config';

const prisma = new PrismaClient();

async function bootstrap() {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const token = process.env.SUPER_ADMIN_BOOTSTRAP_TOKEN;

    if (!email || !token) {
        console.error('❌ Error: SUPER_ADMIN_EMAIL and SUPER_ADMIN_BOOTSTRAP_TOKEN must be set.');
        process.exit(1);
    }

    console.log('🚀 Bootstrapping Super Admin...');

    // 1. Ensure 'default' tenant exists
    let tenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
    if (!tenant) {
        console.log('  - Creating default tenant...');
        tenant = await prisma.tenant.create({
            data: {
                name: 'Platform Administration',
                slug: 'default',
                plan: 'PLATFORM_OWNER'
            }
        });
    }

    // 2. Find or Create Super Admin
    let user = await prisma.user.findUnique({ where: { email } });

    // We use the bootstrap token as the initial password
    const hashedPassword = await argon2.hash(token);

    if (user) {
        console.log('  - Super Admin already exists. Updating password from bootstrap token...');
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                role: 'SUPER_ADMIN',
                tenantId: tenant.id
            }
        });
    } else {
        console.log('  - Creating new Super Admin...');
        await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                role: 'SUPER_ADMIN',
                tenantId: tenant.id,
                username: 'Global Admin'
            }
        });
    }

    console.log('✨ Super Admin bootstrapped successfully.');
    console.log('⚠️  IMPORTANT: Please login and change your password immediately.');
}

bootstrap()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
