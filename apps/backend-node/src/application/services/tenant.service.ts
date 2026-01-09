import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as argon2 from 'argon2';

export class TenantService {
    constructor(private prisma: PrismaClient) { }

    async findAll() {
        return this.prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { users: true, assets: true, workOrders: true }
                }
            }
        });
    }

    async create(name: string, slug: string, adminEmail: string, maxUsers: number = 5, maxAdmins: number = 1, adminPassword: string = 'ScrapHand') {
        return this.prisma.$transaction(async (tx) => {
            // 1. Create Tenant
            const tenant = await tx.tenant.create({
                data: {
                    name,
                    slug,
                    plan: 'ENTERPRISE',
                    maxUsers,
                    maxAdmins
                }
            });

            // 2. Create Admin User
            const hashedPassword = await argon2.hash(adminPassword);
            await tx.user.create({
                data: {
                    email: adminEmail,
                    passwordHash: hashedPassword,
                    username: 'Tenant Admin',
                    role: 'ADMIN',
                    tenantId: tenant.id
                }
            });

            // 3. Seed Default Roles
            await this.seedDefaultRoles(tx, tenant.id);

            return tenant;
        });
    }

    async update(id: string, data: any) {
        return this.prisma.tenant.update({
            where: { id },
            data
        });
    }

    private async seedDefaultRoles(tx: any, tenantId: string) {
        const defaultRoles = [
            {
                name: 'ADMIN',
                description: 'Full system access',
                permissions: ['*'],
                isSystem: true
            },
            {
                name: 'TECHNICIAN',
                description: 'Assigned work orders and asset lockout',
                permissions: [
                    'work_order:read',
                    'work_order:write',
                    'asset:read',
                    'upload:write'
                ],
                isSystem: true
            },
            {
                name: 'MANAGER',
                description: 'Planning and scheduling power user',
                permissions: [
                    'work_order:read',
                    'work_order:write',
                    'work_order:delete',
                    'asset:read',
                    'asset:write',
                    'part:read',
                    'part:write'
                ],
                isSystem: true
            }
        ];

        for (const role of defaultRoles) {
            await tx.role.upsert({
                where: {
                    tenantId_name: {
                        tenantId,
                        name: role.name
                    }
                },
                update: {},
                create: {
                    tenantId,
                    ...role,
                    permissions: JSON.stringify(role.permissions)
                }
            });
        }
    }

    async delete(id: string) {
        // [FIX] Prisma Cascades are often not enabled by default in schema for all relations
        // We'll perform a transaction to clean up or rely on schema. 
        // Let's assume schema has cascades or we do it here. 
        return this.prisma.$transaction(async (tx) => {
            // Deleted nested data first if cascades aren't fully set
            await tx.workOrderPart.deleteMany({ where: { tenantId: id } });
            await tx.workOrderSession.deleteMany({ where: { tenantId: id } });
            await tx.workOrder.deleteMany({ where: { tenantId: id } });
            await tx.attachment.deleteMany({ where: { tenantId: id } });
            await tx.asset.deleteMany({ where: { tenantId: id } });
            await tx.part.deleteMany({ where: { tenantId: id } });
            await tx.role.deleteMany({ where: { tenantId: id } });
            await tx.user.deleteMany({ where: { tenantId: id } });

            return tx.tenant.delete({
                where: { id }
            });
        });
    }

    async seedAstonManorDemo(tenantId: string) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new Error('Tenant not found');

        await this.prisma.$transaction(async (tx) => {
            // 0. Ensure Roles
            await this.seedDefaultRoles(tx, tenantId);

            // Helper to create asset
            const createAsset = async (name: string, type: string, parentId: string | null = null, description: string = '') => {
                const asset = await tx.asset.create({
                    data: {
                        tenantId,
                        name,
                        // type field does not exist, appending to description for clarity
                        description: `${description} (${type})`.trim(),
                        parentId,
                        // status defaults to OPERATIONAL
                        criticality: type === 'PRODUCTION_LINE' ? 'HIGH' : 'MEDIUM'
                    }
                });
                return asset;
            };

            // 1. Root: Aston Manor Cider
            const site = await createAsset('Aston Manor Cider', 'SITE', null, 'Main Production Facility');

            // 2. Production Lines
            const line3 = await createAsset('Line 3 (Glass and Pet Bottle)', 'PRODUCTION_LINE', site.id);
            const line6 = await createAsset('Line 6 (PET Bottle)', 'PRODUCTION_LINE', site.id);
            const line8 = await createAsset('Line 8 (Canning)', 'PRODUCTION_LINE', site.id);

            // 3. Child Assets for Line 3
            await createAsset('Krones Filler', 'EQUIPMENT', line3.id, 'High speed filler');
            await createAsset('Krones Labeller', 'EQUIPMENT', line3.id);
            await createAsset('Palletizer', 'EQUIPMENT', line3.id);

            // 4. Child Assets for Line 6
            await createAsset('Blower', 'EQUIPMENT', line6.id);
            await createAsset('Filler', 'EQUIPMENT', line6.id);
            await createAsset('Packer', 'EQUIPMENT', line6.id);

            // 5. Child Assets for Line 8
            await createAsset('Can Filler', 'EQUIPMENT', line8.id);
            await createAsset('Seamer', 'EQUIPMENT', line8.id);
            await createAsset('Pasteurizer', 'EQUIPMENT', line8.id);

            // 6. Seed Parts (Generic)
            const parts = [
                { name: 'Proximity Sensor 24V', cost: 45.00, currency: 'GBP', qty: 10 },
                { name: 'Conveyor Belt (10m)', cost: 250.00, currency: 'GBP', qty: 2 },
                { name: 'Bearing SKU-99', cost: 12.50, currency: 'GBP', qty: 20 },
                { name: 'Hydraulic Seal Kit', cost: 85.00, currency: 'GBP', qty: 5 },
            ];

            for (const p of parts) {
                await tx.part.create({
                    data: {
                        tenantId,
                        name: p.name,
                        cost: p.cost,
                        currency: p.currency,
                        quantity: p.qty,
                        minQuantity: 5
                    }
                });
            }

            // 7. Create a few Work Orders
            await tx.workOrder.create({
                data: {
                    tenantId,
                    assetId: line8.id,
                    title: 'Seamer Maintenance',
                    description: 'Regular checkout of can seamer heads',
                    priority: 'HIGH',
                    status: 'OPEN',
                    rimeScore: 60
                }
            });
        }, {
            maxWait: 10000,
            timeout: 20000
        });
    }
}
