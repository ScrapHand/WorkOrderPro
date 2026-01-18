import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function nuke() {
    console.log('☢️ INITIATING NUCLEAR STRIKE ON REMOTE DB...');

    try {
        // Attempt 1: Fast Truncate
        console.log('Attempting TRUNCATE CASCADE...');
        await prisma.$executeRawUnsafe(`
            TRUNCATE TABLE "User", "Tenant", "Asset", "WorkOrder", "session", "Role", 
            "PMSchedule", "PMLog", "InventoryItem", "Part", "PartTransaction", 
            "Attachment", "AuditLog", "ShiftHandover", "WorkOrderComment", 
            "WorkOrderPart", "WorkOrderSession", "FeatureEntitlement" CASCADE;
        `);
        console.log('TRUNCATE command executed.');
    } catch (e) {
        console.error('TRUNCATE failed (likely permission/FK lock), switching to DELETE MANY:', e);
    }

    // Attempt 2: Verify and Cleanup via Prisma Client
    const userCount = await prisma.user.count();
    if (userCount > 0) {
        console.log(`⚠️ Database still has ${userCount} users. Running DELETE MANY...`);
        // Delete order matters for FKs
        await prisma.auditLog.deleteMany();
        await prisma.session.deleteMany();
        await prisma.workOrderComment.deleteMany();
        await prisma.workOrderSession.deleteMany();
        await prisma.workOrderPart.deleteMany();
        await prisma.workOrder.deleteMany();
        await prisma.pMLog.deleteMany();
        await prisma.pMSchedule.deleteMany();
        await prisma.asset.deleteMany();
        await prisma.user.deleteMany();
        await prisma.tenant.deleteMany();
        console.log('DELETE MANY sequence complete.');
    } else {
        console.log('✅ Database confirmed empty.');
    }

    // Re-seed Super Admin
    console.log('🚀 Re-seeding Platform Super Admin...');
    const systemTenant = await prisma.tenant.create({
        data: {
            slug: 'system',
            name: 'Platform Systems',
            plan: 'enterprise',
            brandColor: '#4f46e5'
        }
    });

    // ... (inside nuke function)
    const password = 'ScrapHandNcc1701bbc!';
    const passwordHash = await argon2.hash(password);

    await prisma.user.create({
        data: {
            email: 'scraphand@admin.com',
            passwordHash,
            role: 'SUPER_ADMIN',
            username: 'Platform Architect',
            tenantId: systemTenant.id
        }
    });
    console.log('✅ Super Admin Restored.');
}

nuke()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
