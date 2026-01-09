import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning up existing users...');

    // Delete all users
    const deletedCount = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${deletedCount.count} existing users`);

    // Ensure default tenant exists
    const slug = 'default';
    let tenant = await prisma.tenant.findUnique({ where: { slug } });

    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                slug,
                name: 'Default Tenant',
                plan: 'pro',
                brandColor: '#2563eb',
                logoUrl: 'https://via.placeholder.com/150'
            }
        });
        console.log(`✅ Created tenant: ${tenant.slug}`);
    } else {
        console.log(`✅ Using existing tenant: ${slug}`);
    }

    // Create SuperAdmin user
    const email = 'scraphand@admin.com';
    const password = 'ScrapHandNcc1701bbc!';
    const passwordHash = await bcrypt.hash(password, 10);

    const superAdmin = await prisma.user.create({
        data: {
            email,
            passwordHash,
            role: 'ADMIN', // Using ADMIN role as the highest privilege
            username: 'SuperAdmin',
            tenantId: tenant.id
        }
    });

    console.log('\n✨ SuperAdmin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Role:     ${superAdmin.role}`);
    console.log(`🏢 Tenant:   ${tenant.slug}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
