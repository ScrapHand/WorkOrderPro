
import { PrismaClient } from '@prisma/client';
import { UserService } from '../src/application/services/user.service';

const prisma = new PrismaClient();
const userService = new UserService(prisma);

async function main() {
    console.log('🛡️ Starting RBAC Verification...');

    // 1. Setup Data
    const tenantSlug = 'rbac-test-tenant';
    let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                name: 'RBAC Test',
                slug: tenantSlug,
                maxUsers: 10
            }
        });
        // Create Role
        await prisma.role.create({
            data: {
                tenantId: tenant.id,
                name: 'LIMITED_VIEWER',
                permissions: JSON.stringify(['work_order:read']),
                isSystem: false
            }
        });
    }

    // 2. Create Users
    const adminEmail = `admin-${Date.now()}@test.com`;
    const viewerEmail = `viewer-${Date.now()}@test.com`;
    const limitedEmail = `limited-${Date.now()}@test.com`;

    const admin = await userService.createUser(tenant.id, adminEmail, 'ADMIN');
    const viewer = await userService.createUser(tenant.id, viewerEmail, 'VIEWER'); // System Role
    const limited = await userService.createUser(tenant.id, limitedEmail, 'LIMITED_VIEWER'); // Custom Role Name (logic will resolve this)

    // 3. Verify Permissions
    console.log('\n🧪 Testing Permissions...');

    // A. Admin (Should have *)
    const adminPerms = await userService.getUserPermissions(admin.id);
    console.log(`Admin (${admin.role}):`, adminPerms.includes('*') ? '✅ PASS' : '❌ FAIL', adminPerms);

    // B. Viewer (System Role - should be empty or specific if seeded)
    // Note: Default seed might not have permissions for VIEWER yet, so simple string check might return []
    const viewerPerms = await userService.getUserPermissions(viewer.id);
    console.log(`Viewer (${viewer.role}):`, viewerPerms.length === 0 ? '✅ PASS (Empty Default)' : '❓ NOTE', viewerPerms);

    // C. Limited (Custom Role via Name Lookup or ID if we assigned ID)
    // createUser assigns `role` string. `getUserPermissions` looks up role by name if customRoleId is null.
    const limitedPerms = await userService.getUserPermissions(limited.id);
    console.log(`Limited (${limited.role}):`, limitedPerms.includes('work_order:read') ? '✅ PASS' : '❌ FAIL', limitedPerms);

    // 4. Cleanup
    console.log('\n🧹 Cleaning up...');
    await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.role.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.tenant.delete({ where: { id: tenant.id } });

    console.log('✨ Done.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
