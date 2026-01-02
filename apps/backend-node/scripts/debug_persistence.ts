
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DEBUG: Testing Asset JSON Persistence ---');

    // 1. Find an asset
    const asset = await prisma.asset.findFirst();
    if (!asset) {
        console.log('No assets found.');
        return;
    }
    console.log(`Found Asset: ${asset.id} (${asset.name})`);
    console.log('Current Documents:', JSON.stringify(asset.documents));

    // 2. Update Documents
    const newDoc = {
        name: "Debug Test.pdf",
        url: "https://example.com/test.pdf",
        type: "application/pdf",
        key: "debug-key-123",
        timestamp: new Date().toISOString()
    };

    const currentDocs = (asset.documents as any[]) || [];
    const updatedDocs = [...currentDocs, newDoc];

    console.log('Updating with:', JSON.stringify(updatedDocs));

    const updated = await prisma.asset.update({
        where: { id: asset.id },
        data: { documents: updatedDocs }
    });

    console.log('Update Complete.');
    console.log('New Documents in DB:', JSON.stringify(updated.documents));

    // 3. Verify Persistence (Fetch again)
    const refetched = await prisma.asset.findUnique({ where: { id: asset.id } });
    console.log('Refetched Documents:', JSON.stringify(refetched?.documents));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
