import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function audit() {
    console.log('🔍 Auditing Remote Database...');
    const count = await prisma.user.count();
    console.log(`TOTAL USERS: ${count}`);

    const users = await prisma.user.findMany({ select: { email: true, role: true, tenantId: true } });
    if (users.length > 0) {
        console.log('--- USER LIST ---');
        users.forEach(u => console.log(`[${u.role}] ${u.email} (Tenant: ${u.tenantId})`));
    } else {
        console.log('✅ DATABASE IS EMPTY');
    }
}

audit()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
