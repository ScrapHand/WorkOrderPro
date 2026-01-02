
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const assets = await prisma.asset.findMany();
    console.log('--- ALL ASSETS ---');
    assets.forEach(a => console.log(`ID: ${a.id} | Name: ${a.name}`));
    console.log('------------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
