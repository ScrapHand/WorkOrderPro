import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️ CLEAN SLATE PROTOCOL: Truncating all tables...');

    // Explicitly truncate tables to purge legacy accounts like admin@example.com
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User", "Tenant", "Asset", "WorkOrder", "session", "Role" CASCADE;`);

    console.log('✅ Remote database wiped.');
    // [PHASE 11] Seeding disabled for manual environment control.
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
