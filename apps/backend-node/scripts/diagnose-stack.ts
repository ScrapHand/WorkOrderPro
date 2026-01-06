import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function diagnose() {
    console.log('🔍 Starting Diagnostic Audit...');

    try {
        console.log('1. Checking Database Connection...');
        await prisma.$queryRaw`SELECT 1`;
        console.log('   ✅ Database Connection OK');

        console.log('2. Verifying Models in Prisma Client...');
        const models = Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'));
        console.log('   Available Models:', models.join(', '));

        const requiredModels = ['tenant', 'user', 'asset', 'workOrder', 'auditLog', 'session'];
        for (const model of requiredModels) {
            if ((prisma as any)[model]) {
                console.log(`   ✅ Model "${model}" is present.`);
            } else {
                console.warn(`   ❌ Model "${model}" is MISSING from Prisma Client!`);
            }
        }

        console.log('3. Testing session table exists...');
        try {
            await prisma.$queryRaw`SELECT * FROM "session" LIMIT 1`;
            console.log('   ✅ "session" table exists in DB.');
        } catch (e: any) {
            console.error('   ❌ "session" table missing or inaccessible:', e.message);
        }

        console.log('4. Testing auditLog table exists...');
        try {
            await prisma.$queryRaw`SELECT * FROM "AuditLog" LIMIT 1`;
            console.log('   ✅ "AuditLog" table exists in DB.');
        } catch (e: any) {
            // Try lowercase just in case
            try {
                await prisma.$queryRaw`SELECT * FROM "audit_log" LIMIT 1`;
                console.log('   ✅ "audit_log" table exists in DB (snake_case).');
            } catch (e2) {
                console.error('   ❌ "AuditLog" table missing or inaccessible.');
            }
        }

    } catch (error: any) {
        console.error('🚨 DIAGNOSTIC FATAL ERROR:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
