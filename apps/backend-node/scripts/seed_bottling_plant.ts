
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Bottling Plant Seeding...');

    // 1. Get Default Tenant (or first one)
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        throw new Error('No tenant found. Please run basic seed first.');
    }
    const tenantId = tenant.id;
    console.log(`Using Tenant: ${tenant.name} (${tenantId})`);

    // 2. Clean up existing data (Transactional & Master)
    console.log('🧹 Cleaning up old data...');
    // Delete in order of constraints
    await prisma.workOrderSession.deleteMany({ where: { tenantId } });
    await prisma.workOrderPart.deleteMany({ where: { workOrder: { tenantId } } });
    await prisma.attachment.deleteMany({ where: { tenantId } });
    await prisma.workOrder.deleteMany({ where: { tenantId } });

    // Inventory cleanup
    await prisma.inventoryTransaction.deleteMany({ where: { part: { tenantId } } });
    await prisma.part.deleteMany({ where: { tenantId } });

    // Asset cleanup (Recursive handling is tricky with Prisma deleteMany, 
    // but since we want to wipe ALL assets for the tenant, deleteMany works if no other constraints block it.
    // We might have self-referential issues if not cascade. 
    // We will try deleting from bottom up or just deleteMany if the DB allows cascade.)
    // Simplest: Find all assets, delete. If failure, we might need a raw query or multiple passes.
    try {
        await prisma.asset.deleteMany({ where: { tenantId } });
    } catch (e) {
        console.warn("Standard delete failed, trying manual cascade...");
        const assets = await prisma.asset.findMany({ where: { tenantId }, select: { id: true } });
        for (const a of assets) {
            try { await prisma.asset.delete({ where: { id: a.id } }); } catch { }
        }
        await prisma.asset.deleteMany({ where: { tenantId } }); // Final sweep
    }

    console.log('✨ Cleaned up.');

    // 3. Create Departments (Root Groups)
    const departments = ['Production', 'Engineering', 'Process', 'Health & Safety'];
    const deptMap: Record<string, string> = {};

    for (const name of departments) {
        const asset = await prisma.asset.create({
            data: {
                tenantId,
                name,
                description: `${name} Department`,
                hierarchyPath: `/${name}`,
                imageUrl: getDeptImage(name)
            }
        });
        deptMap[name] = asset.id;
    }

    // 4. Create Production Lines
    const lines = ['Line 1 (Glass)', 'Line 2 (PET)', 'Line 3 (Cans)'];
    const lineMap: Record<string, string> = {};

    for (const name of lines) {
        const asset = await prisma.asset.create({
            data: {
                tenantId,
                parentId: deptMap['Production'],
                name,
                description: 'High speed bottling line',
                status: Math.random() > 0.8 ? 'DOWN' : 'OPERATIONAL', // Random status
                hierarchyPath: `/Production/${name}`,
            }
        });
        lineMap[name] = asset.id;

        // Create Machines per Line
        const machines = [
            { name: 'Depalletizer', crit: 'B' },
            { name: 'Rinsing Machine', crit: 'A' },
            { name: 'Filler & Capper', crit: 'A', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=300' },
            { name: 'Labeler', crit: 'B' },
            { name: 'Case Packer', crit: 'B' },
            { name: 'Palletizer', crit: 'C' }
        ];

        for (const m of machines) {
            await prisma.asset.create({
                data: {
                    tenantId,
                    parentId: asset.id,
                    name: m.name,
                    criticality: m.crit,
                    status: Math.random() > 0.9 ? 'MAINTENANCE' : 'OPERATIONAL',
                    hierarchyPath: `/Production/${name}/${m.name}`,
                    imageUrl: m.image
                }
            });
        }
    }

    // 5. Create Process Areas
    const processAreas = ['Syrup Room', 'Water Treatment', 'CIP Kitchen'];
    for (const name of processAreas) {
        await prisma.asset.create({
            data: {
                tenantId,
                parentId: deptMap['Process'],
                name,
                status: 'OPERATIONAL'
            }
        });
    }

    // 6. Create H&S Assets
    await prisma.asset.create({
        data: { tenantId, parentId: deptMap['Health & Safety'], name: 'Fire Pump House', criticality: 'A' }
    });
    await prisma.asset.create({
        data: { tenantId, parentId: deptMap['Health & Safety'], name: 'Eye Wash Stations', criticality: 'C' }
    });

    // 7. Create Parts (Inventory)
    console.log('📦 Seeding Inventory...');
    const partsData = [
        { name: 'Proximity Sensor M12', sku: 'ELEC-SN-001', cost: 45.00, qty: 12, bin: 'A-01' },
        { name: 'Conveyor Chain Link', sku: 'MECH-CH-055', cost: 12.50, qty: 50, bin: 'B-04' },
        { name: 'E-Stop Button', sku: 'ELEC-BTN-009', cost: 35.00, qty: 3, bin: 'A-02' },
        { name: 'Food Grade Grease (Tube)', sku: 'LUBE-FG-001', cost: 15.00, qty: 20, bin: 'L-01' },
        { name: 'Filler Valve Seal Kit', sku: 'SEAL-FV-100', cost: 85.00, qty: 8, bin: 'S-10' }
    ];

    for (const p of partsData) {
        await prisma.part.create({
            data: {
                tenantId,
                name: p.name,
                sku: p.sku,
                cost: p.cost,
                quantity: p.qty,
                binLocation: p.bin
            }
        });
    }

    // 8. Generate Work Orders
    console.log('📋 Generating Work Orders...');
    const allAssets = await prisma.asset.findMany({ where: { tenantId } });
    const users = await prisma.user.findMany({ where: { tenantId } });

    // Helper to pick random
    const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const dates = [-5, -3, -2, -1, 0, 1, 3]; // Days offset

    const woTemplates = [
        { title: 'Weekly Lubrication', desc: 'Grease all bearings on the main drive.', pri: 'MEDIUM' },
        { title: 'Replace Proximity Sensor', desc: 'Sensor failing intermittently.', pri: 'HIGH' },
        { title: 'Safety Guard Inspection', desc: 'Check all interlocks.', pri: 'CRITICAL' },
        { title: 'Clean Inkjet Nozzles', desc: 'Poor print quality reported.', pri: 'LOW' },
        { title: 'CIP Validation', desc: 'Verify conductivity setpoints.', pri: 'HIGH' }
    ];

    for (const days of dates) {
        const numWos = Math.floor(Math.random() * 3) + 1; // 1-3 WOs per "day" slot
        for (let i = 0; i < numWos; i++) {
            const tpl = pick(woTemplates);
            const asset = pick(allAssets);
            const user = Math.random() > 0.3 ? pick(users) : null;

            const date = new Date();
            date.setDate(date.getDate() + days);

            let status = 'OPEN';
            let completedAt: Date | null = null;

            if (days < 0) {
                status = Math.random() > 0.3 ? 'DONE' : 'IN_PROGRESS';
                if (status === 'DONE') completedAt = new Date(date.getTime() + 3600000); // 1 hour later
            }

            await prisma.workOrder.create({
                data: {
                    tenantId,
                    assetId: asset.id,
                    title: tpl.title,
                    description: tpl.desc,
                    priority: tpl.pri,
                    status,
                    createdAt: date,
                    completedAt,
                    assignedUserId: user?.id,
                    rimeScore: Math.floor(Math.random() * 100)
                }
            });
        }
    }

    console.log('✅ Seeding Complete!');
}

function getDeptImage(name: string) {
    if (name === 'Production') return 'https://images.unsplash.com/photo-1598555894101-903dfc039322?auto=format&fit=crop&w=300';
    if (name === 'Engineering') return 'https://images.unsplash.com/photo-1581093458791-9f302e6d8ce9?auto=format&fit=crop&w=300';
    return null;
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
