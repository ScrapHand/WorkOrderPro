import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listTenants() {
    console.log('🔍 Auditing Remote Tenants...');
    const tenants = await prisma.tenant.findMany();
    console.log('--- TENANT LIST ---');
    tenants.forEach(t => console.log(`[${t.slug}] ${t.name} (${t.id})`));
}

listTenants()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
