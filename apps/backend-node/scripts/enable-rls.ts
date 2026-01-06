import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tables = [
    'Asset',
    'WorkOrder',
    'Part',
    'WorkOrderPart',
    'Attachment',
    'WorkOrderSession',
    'InventoryTransaction',
    'User',
    'Role'
];

async function main() {
    console.log('🚀 Enabling RLS on tenant-owned tables...');

    for (const table of tables) {
        try {
            console.log(`  - Processing ${table}...`);

            // 1. Enable RLS
            await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);

            // 2. Drop existing policy if it exists (for idempotency)
            await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS tenant_isolation_policy ON "${table}";`);

            // 3. Create Policy
            // We cast both sides to text to ensure compatibility regardless of whether 
            // the column is UUID or TEXT.
            await prisma.$executeRawUnsafe(`
                CREATE POLICY tenant_isolation_policy ON "${table}"
                USING (tenant_id::text = current_setting('app.tenant_id'));
            `);

            console.log(`    ✅ RLS enabled and policy created for ${table}`);
        } catch (error) {
            console.error(`    ❌ Failed to process ${table}:`, error);
        }
    }

    console.log('✨ RLS enforcement complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
