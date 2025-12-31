"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const postgres_asset_repository_1 = require("./src/infrastructure/repositories/postgres-asset.repository");
const asset_service_1 = require("./src/application/services/asset.service");
const prisma = new client_1.PrismaClient();
const repo = new postgres_asset_repository_1.PostgresAssetRepository(prisma);
const service = new asset_service_1.AssetService(repo);
async function run() {
    const tenantSlug = 'tree-test-corp';
    // 1. Ensure Tenant
    let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                slug: tenantSlug,
                name: 'Tree Test Corp',
                plan: 'enterprise'
            }
        });
        console.log('Created Tenant:', tenant.id);
    }
    const tenantId = tenant.id; // UUID from DB
    // 2. Clear old test data (optional, but good for idempotency)
    // await prisma.asset.deleteMany({ where: { tenantId } });
    console.log('Seeding Hierarchy...');
    // 3. Seed Hierarchy
    // Level 1
    const site = await service.createAsset(tenantId, 'Site A', null, 'Main Manufacturing Site');
    console.log('Created Root:', site.id);
    // Level 2
    const building = await service.createAsset(tenantId, 'Building 1', site.id, 'Assembly Hall');
    console.log('Created Child:', building.id);
    // Level 3
    const room = await service.createAsset(tenantId, 'Room 101', building.id, 'Control Room');
    console.log('Created Grandchild:', room.id);
    // 4. Verify Tree Retrieval (CTE)
    console.log(`Fetching Tree for Root: ${site.id}`);
    const tree = await repo.findSubtree(site.id, tenantId);
    console.log('Tree Result:', JSON.stringify(tree, null, 2));
    if (tree.length !== 3) {
        throw new Error(`Expected 3 assets, got ${tree.length}`);
    }
    // Verify Paths
    const rootNode = tree.find(a => a.id === site.id);
    const childNode = tree.find(a => a.id === room.id);
    if (!rootNode)
        throw new Error('Root node missing');
    if (!childNode)
        throw new Error('Leaf node missing');
    console.log('CTE Verification SUCCESS!');
    process.exit(0);
}
run().catch(e => {
    console.error(e);
    process.exit(1);
});
