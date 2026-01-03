import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Full Bottling Plant Seeding...');

    // 1. Get Default Tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) throw new Error('No tenant found. Run basic seed first.');
    const tenantId = tenant.id;
    console.log(`Using Tenant: ${tenant.name}`);

    // 2. Clean up (Transactions first, then Master)
    console.log('🧹 Cleaning up old data...');
    const trunc = async (model: string) => {
        try { await (prisma as any)[model].deleteMany({ where: { tenantId } }); } catch (e) { }
    };
    await trunc('workOrderSession');
    await trunc('workOrderPart');
    await trunc('attachment');
    await trunc('workOrder');
    try { await prisma.inventoryTransaction.deleteMany({}); } catch { } // loose constraint
    await trunc('part');

    // Asset self-ref delete hack
    const allAssets = await prisma.asset.findMany({ where: { tenantId }, select: { id: true } });
    for (const a of allAssets) { try { await prisma.asset.delete({ where: { id: a.id } }); } catch { } }
    await trunc('asset'); // Sweep
    console.log('✨ Cleaned up.');

    // HELPERS
    const createAsset = async (name: string, parentId: string | null = null, desc: string = '', crit: string | null = null, img: string | null = null) => {
        const hierarchyPath = parentId ? (await prisma.asset.findUnique({ where: { id: parentId } }))?.hierarchyPath + '/' + name : '/' + name;
        return await prisma.asset.create({
            data: { tenantId, parentId, name, description: desc, criticality: crit, hierarchyPath, imageUrl: img, status: 'OPERATIONAL' }
        });
    };

    // 3. Departments (Roots)
    const deptProd = await createAsset('Production', null, 'Bottling & Packaging', 'A', 'https://images.unsplash.com/photo-1530982011887-3cc11cc85693?auto=format&fit=crop&w=300');
    const deptUtil = await createAsset('Utilities', null, 'Steam, Air, Water, CO2', 'A', 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=300');
    const deptFac = await createAsset('Facilities', null, 'Building & Offices', 'C', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300');
    const deptWare = await createAsset('Warehouse', null, 'Logistics & Storage', 'B', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300');

    // 4. UTILITIES (The Heart)
    const boilerRoom = await createAsset('Boiler Room', deptUtil.id);
    await createAsset('Steam Gen 1', boilerRoom.id, 'Babcock Wanson 2T', 'A');
    await createAsset('Steam Gen 2', boilerRoom.id, 'Babcock Wanson 2T', 'A');
    await createAsset('Steam Gen 3', boilerRoom.id, 'Backup Generator', 'B');

    const compHouse = await createAsset('Compressor House', deptUtil.id);
    await createAsset('Compressor A', compHouse.id, 'Atlas Copco GA75', 'A');
    await createAsset('Compressor B', compHouse.id, 'Atlas Copco GA75', 'A');
    await createAsset('Air Dryer', compHouse.id, 'Refrigerant Dryer', 'B');

    const waterTreat = await createAsset('Water Treatment', deptUtil.id);
    await createAsset('RO Plant', waterTreat.id, 'Reverse Osmosis Unit', 'A');
    await createAsset('Raw Water Tank', waterTreat.id, '50,000L Storage', 'B');
    await createAsset('Chlorine Dosing', waterTreat.id, 'Dosing Pump Skid', 'A');

    const tankFarm = await createAsset('Tank Farm', deptUtil.id);
    await createAsset('LCO2 Tank 1', tankFarm.id, 'Liquid CO2 20T', 'A');
    await createAsset('LCO2 Tank 2', tankFarm.id, 'Liquid CO2 20T', 'A');
    await createAsset('LIN Tank', tankFarm.id, 'Liquid Nitrogen', 'B');

    // 5. FACILITIES (Offices & Building)
    const officeBlock = await createAsset('Main Office Block', deptFac.id);
    const floors = ['Ground Floor', '1st Floor'];
    for (const f of floors) {
        const floor = await createAsset(f, officeBlock.id);
        await createAsset('Open Plan Office', floor.id, 'Desks & Networking', 'C');
        await createAsset('Meeting Room A', floor.id, 'Projector & VC', 'C');
        await createAsset('Kitchenette', floor.id, 'Coffee & Dishwasher', 'C');
    }
    await createAsset('Server Room', officeBlock.id, 'Main IT Rack', 'A');
    await createAsset('Carpark Lighting', deptFac.id, 'External LED', 'C');

    // 6. PRODUCTION (Detailed Lines)
    // Line 1: Glass (Beer)
    const line1 = await createAsset('Line 1 (Glass 330ml)', deptProd.id, 'High Speed Glass Line', 'A');

    // Process (Syrup -> Blender)
    const processL1 = await createAsset('Process Area L1', line1.id);
    await createAsset('Sugar Dissolver', processL1.id, 'Continuous Dissolver', 'B');
    await createAsset('Syrup Tanks', processL1.id, '6x 10,000L Tanks', 'B');
    await createAsset('Flash Pasteurizer', processL1.id, 'Alfa Laval Plate Heat Exchanger', 'A');
    await createAsset('Inline Blender', processL1.id, 'Carbo-Blender', 'A');

    // Packaging (Depal -> Palletizer)
    const packL1 = await createAsset('Packaging Area L1', line1.id);
    const depal = await createAsset('Depalletizer', packL1.id, 'Bulk Glass Sweep', 'B');
    await createAsset('Empty Bottle Inspector', packL1.id, 'Camera Vision', 'A');
    await createAsset('Rinser', packL1.id, 'Ionized Air Rinser', 'B');

    const filler = await createAsset('Filler Block', packL1.id, 'Krones Monobloc', 'A');
    await createAsset('Crowner', filler.id, '24 Head', 'A');

    await createAsset('Pasteurizer Tunnel', packL1.id, 'Double Deck Tunnel', 'A');
    await createAsset('Labeler 1', packL1.id, 'Cold Glue Body/Neck', 'B');
    await createAsset('Labeler 2', packL1.id, 'Pressure Sensitive (Promo)', 'C');
    await createAsset('Cluster Packer', packL1.id, 'Mead Westvaco', 'B');
    await createAsset('Tray Packer', packL1.id, 'Kisters Tray/Shrink', 'B');
    await createAsset('Palletizer', packL1.id, 'High Level Palletizer', 'B');
    await createAsset('Pallet Wrapper', packL1.id, 'Robopac Arm', 'C');

    // Conveyors
    const convL1 = await createAsset('Conveyor Systems', line1.id);
    await createAsset('Mass Flow Accumulation', convL1.id, 'Between Filler & Tunnel', 'B');
    await createAsset('Single File Transport', convL1.id, 'Lube Tracks', 'C');
    await createAsset('Pack Conveyors', convL1.id, 'Roller/Belt Mix', 'C');

    // 7. INVENTORY (Parts)
    console.log('📦 Seeding Parts...');
    const parts = [
        { n: 'Photoeye Retro-Reflective', s: 'SICK-WL100', c: 65.00, q: 20 },
        { n: 'Proximity Sensor M18', s: 'IFM-IG5005', c: 45.00, q: 15 },
        { n: 'Solenoid Valve 24VDC', s: 'FESTO-CPE18', c: 120.00, q: 8 },
        { n: 'Bearing Unit pillow block', s: 'SKF-SY-20', c: 35.00, q: 30 },
        { n: 'Flat Belt (Green)', s: 'HABASIT-F10', c: 250.00, q: 2 },
        { n: 'Conveyor Guide Rail (White)', s: 'UHMW-PE-20', c: 80.00, q: 50 },
        { n: 'Mechanical Seal', s: 'GRUNDFOS-Kit', c: 180.00, q: 4 },
        { n: 'HMI Touch Screen 10"', s: 'SIEMENS-TP900', c: 2500.00, q: 1 },
        { n: 'Contactor 9A', s: 'SCHNEIDER-LC1D09', c: 25.00, q: 12 },
        { n: 'LED Panel 600x600', s: 'PHILIPS-Light', c: 40.00, q: 100 },
        { n: 'Cat6 Data Module', s: 'PANDUIT-CJ6', c: 5.50, q: 200 }
    ];

    for (const p of parts) {
        await prisma.part.create({
            data: {
                tenantId, name: p.n, sku: p.s, cost: p.c, quantity: p.q,
                minQuantity: 5, binLocation: `Z-${Math.floor(Math.random() * 99)}`
            }
        });
    }

    // 8. Work Orders (Mix)
    console.log('📋 Generating Work Orders...');
    const allWosAssets = await prisma.asset.findMany({ where: { tenantId } });
    const assetMap = new Map(allWosAssets.map(a => [a.name, a]));

    const jobs = [
        { title: 'Conveyor Jammed', desc: 'Bottles stuck at accumulation infeed.', days: 0, pri: 'HIGH', a: 'Mass Flow Accumulation' },
        { title: 'Steam Leak', desc: 'Leak on main header flange gasket.', days: -1, pri: 'CRITICAL', a: 'Steam Gen 1' },
        { title: 'Change Air Filter', desc: 'Compressor B Service Due.', days: 2, pri: 'MEDIUM', a: 'Compressor B' },
        { title: 'Fix Office Lights', desc: 'Row 3 lights flickering.', days: -5, pri: 'LOW', a: 'Open Plan Office' },
        { title: 'Install Data Socket', desc: 'New desk for HR Manager.', days: 1, pri: 'LOW', a: 'Ground Floor' },
        { title: 'Flash Pastemp High', desc: 'Temperature deviation alarm check.', days: -2, pri: 'HIGH', a: 'Flash Pasteurizer' },
        { title: 'Labeler Glue Blockage', desc: 'Nozzle 4 blocked clean required.', days: 0, pri: 'MEDIUM', a: 'Labeler 1' },
        { title: 'Toilet Blocked', desc: 'Gents toilets ground floor.', days: 0, pri: 'HIGH', a: 'Facilities' },
        { title: 'Calibration Due', desc: 'Flow meter verification.', days: 14, pri: 'MEDIUM', a: 'RO Plant' },
        { title: 'CO2 Delivery', desc: 'Escort tanker driver.', days: 3, pri: 'LOW', a: 'LCO2 Tank 1' }
    ];

    for (const job of jobs) {
        const a = assetMap.get(job.a) || allWosAssets[0];
        const date = new Date();
        date.setDate(date.getDate() + job.days);

        const status = job.days < 0 ? 'DONE' : 'OPEN';
        await prisma.workOrder.create({
            data: {
                tenantId, assetId: a.id, title: job.title, description: job.desc,
                priority: job.pri, status, createdAt: date,
                rimeScore: 50
            }
        });
    }

    console.log('✅ Full Plant Seed Complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
