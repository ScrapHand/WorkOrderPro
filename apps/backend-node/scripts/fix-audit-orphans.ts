import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking for orphaned AuditLog userId references...');

    // Find logs with non-null userId that don't exist in User table
    const orphanedLogs = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count FROM "AuditLog"
        WHERE user_id IS NOT NULL
        AND user_id NOT IN (SELECT id FROM "User")
    `;

    console.log(`❌ Found ${(orphanedLogs as any)[0].count} orphaned entries.`);

    if ((orphanedLogs as any)[0].count > 0) {
        console.log('🩹 Nullifying orphaned user references...');
        const updated = await prisma.$executeRaw`
            UPDATE "AuditLog"
            SET user_id = NULL
            WHERE user_id IS NOT NULL
            AND user_id NOT IN (SELECT id FROM "User")
        `;
        console.log(`✅ Fixed ${updated} entries.`);
    } else {
        console.log('✨ No orphans found. Database is clean.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
