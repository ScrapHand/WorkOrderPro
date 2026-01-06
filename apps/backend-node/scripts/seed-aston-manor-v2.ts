import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import 'dotenv/config';

const prisma = new PrismaClient();

const SEED_DATA = [
    // UTILITIES
    { code: 'UT', name: 'Utilities', parent: null, crit: 'A', risk: 4, impact: 5, maint: 3, effort: 3 },
    { code: 'UT-CA', name: 'Compressed Air', parent: 'UT', crit: 'A' },
    { code: 'UT-CA-01', name: 'Compressor 1', parent: 'UT-CA', crit: 'A' },
    { code: 'UT-CA-02', name: 'Compressor 2', parent: 'UT-CA', crit: 'A' },
    { code: 'UT-CA-AD-01', name: 'Air Dryer 1', parent: 'UT-CA', crit: 'A' },
    { code: 'UT-CA-FLT-01', name: 'Main Line Filter', parent: 'UT-CA', crit: 'A' },
    { code: 'UT-CA-AR-01', name: 'Air Receiver', parent: 'UT-CA', crit: 'A' },
    { code: 'UT-CA-PNL-01', name: 'Control Panel', parent: 'UT-CA', crit: 'A' },

    { code: 'UT-WT', name: 'Water Treatment', parent: 'UT', crit: 'A' },
    { code: 'UT-WT-BT-01', name: 'Break Tank', parent: 'UT-WT', crit: 'A' },
    { code: 'UT-WT-RO-01', name: 'Reverse Osmosis', parent: 'UT-WT', crit: 'A' },
    { code: 'UT-WT-UV-01', name: 'UV Steriliser', parent: 'UT-WT', crit: 'A' },
    { code: 'UT-WT-BP-01', name: 'Booster Pump', parent: 'UT-WT', crit: 'A' },

    { code: 'UT-DAL', name: 'De-Aerated Water (DAL)', parent: 'UT', crit: 'A' },
    { code: 'UT-DAL-DEA-01', name: 'De-Aerator Column', parent: 'UT-DAL', crit: 'A' },
    { code: 'UT-DAL-VAC-01', name: 'Vacuum Pump', parent: 'UT-DAL', crit: 'A' },
    { code: 'UT-DAL-PHE-01', name: 'Plate Heat Exchanger', parent: 'UT-DAL', crit: 'A' },
    { code: 'UT-DAL-PMP-01', name: 'DAL Delivery Pump', parent: 'UT-DAL', crit: 'A' },
    { code: 'UT-DAL-INST-01', name: 'Oxygen Sensor', parent: 'UT-DAL', crit: 'A' },

    { code: 'UT-ST', name: 'Steam / Boilers', parent: 'UT', crit: 'A' },
    { code: 'UT-ST-BO-01', name: 'Main Boiler', parent: 'UT-ST', crit: 'A' },
    { code: 'UT-ST-FW-01', name: 'Feedwater Tank', parent: 'UT-ST', crit: 'A' },
    { code: 'UT-ST-BWT-01', name: 'Boiler Water Treatment', parent: 'UT-ST', crit: 'A' },

    { code: 'UT-EL', name: 'Electrical Distribution', parent: 'UT', crit: 'A' },
    { code: 'UT-EL-LV-01', name: 'LV Switchroom', parent: 'UT-EL', crit: 'A' },
    { code: 'UT-EL-MCC-01', name: 'MCC - Utilities', parent: 'UT-EL', crit: 'A' },
    { code: 'UT-EL-UPS-01', name: 'UPS System', parent: 'UT-EL', crit: 'A' },

    // PRODUCTION AREA A
    { code: 'PH-A', name: 'Production Hall A', parent: null, crit: 'B' },

    // LINE 1
    { code: 'L1', name: 'Line 1 - Canning', parent: 'PH-A', crit: 'A', risk: 4, impact: 5, maint: 3, effort: 3 },
    { code: 'L1-DEP-01', name: 'Depalletiser', parent: 'L1', crit: 'A' },
    { code: 'L1-CONV-01', name: 'Case Conveyors', parent: 'L1', crit: 'A' },
    { code: 'L1-RIN-01', name: 'Can Rinser', parent: 'L1', crit: 'A' },
    { code: 'L1-FIL-01', name: 'Filler / Seamer', parent: 'L1', crit: 'A' },
    { code: 'L1-CAP-01', name: 'Capper (Alt Closure)', parent: 'L1', crit: 'A' },
    { code: 'L1-PAS-01', name: 'Pasteuriser', parent: 'L1', crit: 'A' },
    { code: 'L1-LAB-01', name: 'Labeller', parent: 'L1', crit: 'A' },
    { code: 'L1-COD-01', name: 'Coding System', parent: 'L1', crit: 'A' },
    { code: 'L1-CHK-01', name: 'Checkweigher', parent: 'L1', crit: 'A' },
    { code: 'L1-MD-01', name: 'Metal Detector', parent: 'L1', crit: 'A' },
    { code: 'L1-CPK-01', name: 'Case Packer', parent: 'L1', crit: 'A' },
    { code: 'L1-PAL-01', name: 'Palletiser', parent: 'L1', crit: 'A' },
    { code: 'L1-WRP-01', name: 'Pallet Wrapper', parent: 'L1', crit: 'A' },
    { code: 'L1-PNL-01', name: 'Main Line Panel', parent: 'L1', crit: 'A' },
    { code: 'L1-VFD-01', name: 'VFD Inverter Box', parent: 'L1', crit: 'A' },

    // LINE 2
    { code: 'L2', name: 'Line 2 - Bottling', parent: 'PH-A', crit: 'A', risk: 4, impact: 5, maint: 3, effort: 3 },
    { code: 'L2-DEP-01', name: 'Depalletiser', parent: 'L2', crit: 'A' },
    { code: 'L2-CONV-01', name: 'Bottle Conveyors', parent: 'L2', crit: 'A' },
    { code: 'L2-RIN-01', name: 'Bottle Rinser', parent: 'L2', crit: 'A' },
    { code: 'L2-FIL-01', name: 'Bottle Filler', parent: 'L2', crit: 'A' },
    { code: 'L2-SEA-01', name: 'Capper / Sealer', parent: 'L2', crit: 'A' },
    { code: 'L2-PAK-01', name: 'Box Packer', parent: 'L2', crit: 'A' },
    { code: 'L2-CHK-01', name: 'Inspection / Reject', parent: 'L2', crit: 'A' },
    { code: 'L2-PAL-01', name: 'Palletiser', parent: 'L2', crit: 'A' },
    { code: 'L2-WRP-01', name: 'Wrapper', parent: 'L2', crit: 'A' },
    { code: 'L2-PNL-01', name: 'Control Panel', parent: 'L2', crit: 'A' },

    // WAREHOUSE
    { code: 'WH', name: 'Warehouse', parent: null, crit: 'C', risk: 2, impact: 2, maint: 2, effort: 2 },
    { code: 'WH-CONV-01', name: 'Outbound Conveyor', parent: 'WH', crit: 'C' },
    { code: 'WH-DOOR-01', name: 'Rapid Door 1', parent: 'WH', crit: 'C' },
    { code: 'WH-DOOR-02', name: 'Rapid Door 2', parent: 'WH', crit: 'C' },
    { code: 'WH-FC-01', name: 'Forklift Charge Station', parent: 'WH', crit: 'C' },

    // ENGINEERING
    { code: 'ENG', name: 'Engineering Workshop', parent: null, crit: 'B', risk: 1, impact: 3, maint: 1, effort: 1 },
    { code: 'ENG-WS-01', name: 'Lathe Bench', parent: 'ENG', crit: 'B' },
    { code: 'ENG-STR-01', name: 'Parts Store Shelf A', parent: 'ENG', crit: 'B' }
];

async function seed() {
    const tenantSlug = 'aston-manor';
    const adminEmail = process.env.ASTON_ADMIN_EMAIL || 'admin@astonmanor.co.uk';
    const adminPassword = process.env.ASTON_ADMIN_PASSWORD || 'Aston123!';

    console.log(`🌱 Seeding tenant: ${tenantSlug}`);

    // 1. Ensure Tenant
    let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                name: 'Aston Manor Cider - Main Plant',
                slug: tenantSlug,
                brandColor: '#ec4899' // Pinkish/Cider color
            }
        });
    }

    // 2. Ensure Admin User
    let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) {
        const hashedPassword = await argon2.hash(adminPassword);
        admin = await prisma.user.create({
            data: {
                tenantId: tenant.id,
                email: adminEmail,
                passwordHash: hashedPassword,
                role: 'ADMIN',
                username: 'Plant Admin'
            }
        });
    }

    // 3. Seed Assets
    const assetMap = new Map<string, string>(); // code -> id

    for (const item of SEED_DATA) {
        const parentId = item.parent ? assetMap.get(item.parent) : null;

        const asset = await prisma.asset.create({
            data: {
                tenantId: tenant.id,
                parentId,
                code: item.code,
                name: item.name,
                criticality: item.crit,
                rimeRisk: item.risk || null,
                rimeImpact: item.impact || null,
                rimeMaintenance: item.maint || null,
                rimeEffort: item.effort || null,
                status: 'OPERATIONAL'
            }
        });

        assetMap.set(item.code, asset.id);
        console.log(`   ✅ Created Asset: ${item.code}`);
    }

    // 4. Create Sample Work Order
    const filler = assetMap.get('L1-FIL-01');
    if (filler) {
        await prisma.workOrder.create({
            data: {
                tenantId: tenant.id,
                assetId: filler,
                title: 'Seamer Head Rebuild',
                description: 'Rebuild seamer head #4 due to high seam thickness deviation',
                priority: 'HIGH',
                status: 'OPEN',
                rimeScore: 0 // Will be computed by service if using service, but here we just seed
            }
        });
    }

    console.log('✨ Seed complete.');
}

seed()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
