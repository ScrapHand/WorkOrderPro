
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const asset = await prisma.asset.findUnique({
        where: { id: 'hq-001' },
        include: { tenant: true }
    });
    console.log('--- ASSET DETAIL ---');
    if (asset) {
        console.log(`ID: ${asset.id}`);
        console.log(`Tenant ID: ${asset.tenantId}`);
        console.log(`Tenant Slug: ${asset.tenant.slug}`);
    } else {
        console.log('Asset hq-001 NOT FOUND');
    }
    console.log('--------------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
