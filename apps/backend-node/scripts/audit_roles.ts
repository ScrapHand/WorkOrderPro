
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Auditing Roles...');

    // Get all tenants
    const tenants = await prisma.tenant.findMany();

    for (const t of tenants) {
        console.log(`\nTenant: ${t.slug} (${t.id})`);
        const roles = await prisma.role.findMany({ where: { tenantId: t.id } });
        const users = await prisma.user.findMany({ where: { tenantId: t.id } });

        if (roles.length === 0) {
            console.log('  ❌ NO ROLES DEFINED! System Fallback active?');
        }

        for (const r of roles) {
            console.log(`  - Name: ${r.name}, IsSystem: ${r.isSystem}`);
            console.log(`    Permissions: ${r.permissions}`); // Print raw JSON
        }

        console.log(`  Users: ${users.length}`);
        users.slice(0, 5).forEach(u => {
            console.log(`    - ${u.email}: Role=${u.role}, CustomRoleId=${u.customRoleId}`);
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
