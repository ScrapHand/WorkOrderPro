
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const users = await prisma.user.findMany();
    console.log('USERS:', JSON.stringify(users.map(u => ({ email: u.email, role: u.role, tenantId: u.tenantId })), null, 2));

    const tenants = await prisma.tenant.findMany();
    console.log('TENANTS:', JSON.stringify(tenants.map(t => ({ id: t.id, slug: t.slug, name: t.name })), null, 2));

    const asset = await prisma.asset.findUnique({
        where: { id: 'e0fea32f-abd6-4487-9943-265c24b01c93' },
        include: { tenant: true }
    });
    console.log('ASSET:', JSON.stringify(asset, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
