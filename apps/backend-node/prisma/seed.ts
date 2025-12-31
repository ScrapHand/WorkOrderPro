import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    const slug = 'default';
    const existing = await prisma.tenant.findUnique({ where: { slug } });

    if (!existing) {
        const tenant = await prisma.tenant.create({
            data: {
                slug,
                name: 'Default Tenant',
                plan: 'pro'
            }
        });
        console.log(`Created tenant: ${tenant.slug} (${tenant.id})`);
    } else {
        console.log(`Tenant '${slug}' already exists.`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
