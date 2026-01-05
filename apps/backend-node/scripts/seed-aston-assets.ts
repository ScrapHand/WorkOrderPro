import { PrismaClient } from '@prisma/client';
import { PostgresAssetRepository } from '../src/infrastructure/repositories/postgres-asset.repository';
import { AssetService } from '../src/application/services/asset.service';

const prisma = new PrismaClient();
const assetRepo = new PostgresAssetRepository(prisma);
const assetService = new AssetService(assetRepo);

const csvData = `code,parent_code,asset_type,name,rime_code,notes
AMC-OBY,,SITE,Aston Manor Cider - Ops Site,,Top node
BLD-PACK,AMC-OBY,BUILDING,Packaging Building,,
AREA-CAN,BLD-PACK,AREA,Canning Area,,
LINE-CAN-01,AREA-CAN,LINE,Canning Line 1,10,Primary production line
SYS-DEPAL-CAN1,LINE-CAN-01,SYSTEM,Empty Can Depalletiser System,9,Stops line if down
EQ-DEPAL-CAN1,SYS-DEPAL-CAN1,EQUIPMENT,Depalletiser (Fipal type),9,Based on public case study
CMP-DEPAL-MTR1,EQ-DEPAL-CAN1,COMPONENT,Depalletiser Conveyor Motor 1,,
CMP-DEPAL-VFD1,EQ-DEPAL-CAN1,COMPONENT,VFD - Depalletiser Conveyor 1,,
CMP-DEPAL-SEN1,EQ-DEPAL-CAN1,COMPONENT,Photoeye - Infeed Pallet Detect,,
SYS-ELEV-CAN1,LINE-CAN-01,SYSTEM,Spiral Elevator / Vertical Conveyance,8,
EQ-ELEV-CAN1,SYS-ELEV-CAN1,EQUIPMENT,Mass Flow Spiral Elevator,8,
CMP-ELEV-GBX1,EQ-ELEV-CAN1,COMPONENT,Gearbox - Spiral Drive,,
CMP-ELEV-VFD1,EQ-ELEV-CAN1,COMPONENT,VFD - Spiral Drive,,
SYS-RINS-CAN1,LINE-CAN-01,SYSTEM,Can Rinser (Ionised Air),8,
EQ-RINS-CAN1,SYS-RINS-CAN1,EQUIPMENT,Triple Lane Ionised Air Can Rinser,8,
CMP-RINS-BLW1,EQ-RINS-CAN1,COMPONENT,Blower / Air Knife Assembly,,
SYS-FILL-CAN1,LINE-CAN-01,SYSTEM,Filler/Seamer Monobloc,10,Highest criticality
EQ-FILLSEAM-CAN1,SYS-FILL-CAN1,EQUIPMENT,Rotary Volumetric Filler/Seamer,10,Stops all output
CMP-FILL-DRV1,EQ-FILLSEAM-CAN1,COMPONENT,Main Drive Motor,,
CMP-FILL-VFD1,EQ-FILLSEAM-CAN1,COMPONENT,VFD - Main Drive,,
CMP-SEAM-HD1,EQ-FILLSEAM-CAN1,COMPONENT,Seamer Head 1,,
CMP-SEAM-HD2,EQ-FILLSEAM-CAN1,COMPONENT,Seamer Head 2,,
SYS-PAST-CAN1,LINE-CAN-01,SYSTEM,Tunnel Pasteuriser + Cooling,9,Major downtime risk
EQ-PAST-CAN1,SYS-PAST-CAN1,EQUIPMENT,Tunnel Pasteuriser,9,
CMP-PAST-PMP1,EQ-PAST-CAN1,COMPONENT,Pump - Recirculation 1,,
CMP-PAST-VLV1,EQ-PAST-CAN1,COMPONENT,Control Valve - Zone 1,,
SYS-INSP-CAN1,LINE-CAN-01,SYSTEM,Inspection + Reject,8,
EQ-INSP-LVL1,SYS-INSP-CAN1,EQUIPMENT,Level Inspection Station,8,
EQ-REJ-AIR1,SYS-INSP-CAN1,EQUIPMENT,Reject Air Blast Manifold,8,
SYS-EOL-CAN1,LINE-CAN-01,SYSTEM,End Of Line Packaging,8,
EQ-PACK-CAN1,SYS-EOL-CAN1,EQUIPMENT,Multipack Wrapper / Packer,8,
EQ-PAL-CAN1,SYS-EOL-CAN1,EQUIPMENT,Palletiser,8,
EQ-STRETCH-CAN1,SYS-EOL-CAN1,EQUIPMENT,Stretch Wrapper,7,
AREA-BOT,BLD-PACK,AREA,Bottling Area,,
LINE-BOT-01,AREA-BOT,LINE,Bottling Line 1,10,
SYS-FILL-BOT1,LINE-BOT-01,SYSTEM,Bottle Filler,10,
SYS-CAP-BOT1,LINE-BOT-01,SYSTEM,Capper / Closure System,9,
SYS-LABL-BOT1,LINE-BOT-01,SYSTEM,Labeller,8,
SYS-CODE-BOT1,LINE-BOT-01,SYSTEM,Date Coder,6,
SYS-INSP-BOT1,LINE-BOT-01,SYSTEM,Vision / Checkweigh / Reject,8,
SYS-EOL-BOT1,LINE-BOT-01,SYSTEM,Case packer + Palletise + Wrap,8,
BLD-PROC,AMC-OBY,BUILDING,Process / Tank Farm,,
AREA-RECP,BLD-PROC,AREA,Product Reception Tanks,8,
EQ-RECP-TK01,AREA-RECP,EQUIPMENT,Reception Tank 01,8,
EQ-RECP-TK02,AREA-RECP,EQUIPMENT,Reception Tank 02,8,
AREA-BLND,BLD-PROC,AREA,Blending / Carbonation,9,
SYS-PARAMIX-01,AREA-BLND,SYSTEM,De-aerator / Blender / Carbonator (Paramix),9,
AREA-CIP,BLD-PROC,AREA,CIP,9,
SYS-CIP-01,AREA-CIP,SYSTEM,CIP Set 01,9,
EQ-CIP-PMP1,SYS-CIP-01,EQUIPMENT,CIP Pump 1,,
EQ-CIP-PMP2,SYS-CIP-01,EQUIPMENT,CIP Pump 2,,
EQ-CIP-HX1,SYS-CIP-01,EQUIPMENT,CIP Heat Exchanger,,
BLD-UTIL,AMC-OBY,BUILDING,Utilities Building,,
AREA-AIR,BLD-UTIL,AREA,Compressed Air,9,
SYS-AIR-01,AREA-AIR,SYSTEM,Air Compressor Train 01,9,
EQ-AIR-CMP1,SYS-AIR-01,EQUIPMENT,Compressor 1,9,
EQ-AIR-DRY1,SYS-AIR-01,EQUIPMENT,Air Dryer 1,8,
EQ-AIR-FLT1,SYS-AIR-01,EQUIPMENT,Main Line Filters 1,7,
SYS-AIR-02,AREA-AIR,SYSTEM,Air Compressor Train 02,9,
AREA-CHW,BLD-UTIL,AREA,Chilled Water / Glycol,8,
SYS-CHLR-01,AREA-CHW,SYSTEM,Chiller 01,8,
SYS-CHLR-02,AREA-CHW,SYSTEM,Chiller 02 / Process Cooling,8,
AREA-WTR,BLD-UTIL,AREA,Water Systems,8,
SYS-RO-01,AREA-WTR,SYSTEM,RO / Filtration,7,
SYS-DAL-01,AREA-WTR,SYSTEM,Deaerated Water Line (DAL),8,
AREA-ELEC,BLD-UTIL,AREA,Electrical Distribution,10,
SYS-MCC-PACK,AREA-ELEC,SYSTEM,MCC - Packaging,10,
SYS-MCC-PROC,AREA-ELEC,SYSTEM,MCC - Process,10,
BLD-WH,AMC-OBY,BUILDING,Warehouse,,
AREA-RM,BLD-WH,AREA,Raw Materials Stores,5,
AREA-FG,BLD-WH,AREA,Finished Goods,6,
BLD-QA,AMC-OBY,BUILDING,QA / Lab,7,
SYS-QA-01,BLD-QA,SYSTEM,QA Bench + Instruments,7,`;

async function main() {
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'aston' } });
    if (!tenant) {
        console.error('Tenant "aston" not found. Run seed_roles_v2.ts first or create tenant manually.');
        return;
    }
    const tenantId = tenant.id;

    const lines = csvData.trim().split('\n').slice(1);
    const assetMap = new Map<string, string>(); // code -> id

    for (const line of lines) {
        const [code, parentCode, type, name, rimeCode, notes] = line.split(',');

        console.log(`Processing ${code} (Parent: ${parentCode || 'ROOT'})...`);

        // Map rimeCode (1-10) to A, B, C or just use as is in criticality if we adjust RimeService
        // Asset model currently uses String for criticality. RimeService maps A -> 10, B -> 5, C -> 1.
        // We'll map accordingly: 8-10 -> A, 4-7 -> B, 1-3 -> C.
        let criticality: 'A' | 'B' | 'C' = 'C';
        const rc = parseInt(rimeCode);
        if (rc >= 8) criticality = 'A';
        else if (rc >= 4) criticality = 'B';

        const parentId = parentCode ? assetMap.get(parentCode) : null;

        const asset = await assetService.createAsset(
            tenantId,
            name,
            parentId || null,
            notes || undefined,
            criticality,
            null, // imageUrl
            null, // lotoConfig
            code
        );

        assetMap.set(code, asset.id);
        console.log(`Created asset: ${name} (${code}) -> ID: ${asset.id}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
