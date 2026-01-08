import { PrismaClient } from '@prisma/client';
import { IAssetRepository } from '../../domain/repositories/asset.repository.interface';
import { Asset } from '../../domain/entities/asset.entity';

// Helper to map Prisma result to Domain Entity
const mapToDomain = (row: any): Asset => {
    return new Asset(
        row.id,
        row.tenant_id || row.tenantId,
        row.name,
        row.code,
        row.status as 'OPERATIONAL' | 'DOWN' | 'MAINTENANCE',
        row.criticality as 'A' | 'B' | 'C',
        row.hierarchy_path || row.hierarchyPath,
        row.parent_id || row.parentId,
        row.description,
        row.image_url || row.imageUrl,
        row.loto_config || row.lotoConfig,
        row.documents,
        row.specs,
        row.rime_risk || row.rimeRisk || null,
        row.rime_impact || row.rimeImpact || null,
        row.rime_maintenance || row.rimeMaintenance || null,
        row.rime_effort || row.rimeEffort || null,
        row.createdAt ? new Date(row.createdAt) : undefined,
        row.updatedAt ? new Date(row.updatedAt) : undefined,
        row.deletedAt ? new Date(row.deletedAt) : null
    );
};

export class PostgresAssetRepository implements IAssetRepository {
    constructor(private prisma: PrismaClient) { }

    async create(asset: Asset): Promise<void> {
        await this.prisma.asset.create({
            data: {
                id: asset.id,
                tenantId: asset.tenantId,
                parentId: asset.parentId,
                name: asset.name,
                code: asset.code,
                description: asset.description,
                imageUrl: asset.imageUrl,
                lotoConfig: asset.lotoConfig ?? undefined,
                documents: asset.documents ?? undefined,
                specs: asset.specs as any, // [FIX] Cast to any for Prisma Json compat
                status: asset.status,
                criticality: asset.criticality,
                rimeRisk: asset.rimeRisk,
                rimeImpact: asset.rimeImpact,
                rimeMaintenance: asset.rimeMaintenance,
                rimeEffort: asset.rimeEffort,
                hierarchyPath: asset.hierarchyPath
            }
        });
    }

    async update(asset: Asset): Promise<void> {
        await this.prisma.asset.update({
            where: { id: asset.id },
            data: {
                name: asset.name,
                code: asset.code,
                status: asset.status,
                criticality: asset.criticality,
                rimeRisk: asset.rimeRisk,
                rimeImpact: asset.rimeImpact,
                rimeMaintenance: asset.rimeMaintenance,
                rimeEffort: asset.rimeEffort,
                hierarchyPath: asset.hierarchyPath,
                imageUrl: asset.imageUrl,
                lotoConfig: asset.lotoConfig ?? undefined,
                documents: asset.documents ?? undefined,
                specs: asset.specs as any, // [FIX] Cast to any
                deletedAt: asset.deletedAt
            }
        });
    }

    async findById(id: string, tenantId: string): Promise<Asset | null> {
        const result = await this.prisma.asset.findFirst({
            where: { id, tenantId, deletedAt: null }
        });
        return result ? mapToDomain(result) : null;
    }

    async findChildren(parentId: string, tenantId: string): Promise<Asset[]> {
        const results = await this.prisma.asset.findMany({
            where: { parentId, tenantId, deletedAt: null }
        });
        return results.map(mapToDomain);
    }

    async findAll(tenantId: string): Promise<Asset[]> {
        const results = await this.prisma.asset.findMany({
            where: { tenantId, deletedAt: null }
        });
        return results.map(mapToDomain);
    }

    async findSubtree(rootId: string, tenantId: string): Promise<Asset[]> {
        // [ARCH] Recursive CTE for Deep Tree Retrieval - Optimized
        const start = Date.now();
        try {
            const rawResults: any[] = await this.prisma.$queryRaw`
                WITH RECURSIVE asset_tree AS (
                    -- Base Case: The Root
                    SELECT id, tenant_id, parent_id, name, code, status, criticality, hierarchy_path, "description", image_url, loto_config, documents, specs, "createdAt", "updatedAt", "deletedAt", 0 as depth
                    FROM "Asset"
                    WHERE id = ${rootId} AND tenant_id = ${tenantId} AND "deletedAt" IS NULL
                    
                    UNION ALL
                    
                    -- Recursive Step: Direct Children
                    SELECT child.id, child.tenant_id, child.parent_id, child.name, child.code, child.status, child.criticality, child.hierarchy_path, child."description", child.image_url, child.loto_config, child.documents, child.specs, child."createdAt", child."updatedAt", child."deletedAt", parent.depth + 1
                    FROM "Asset" child
                    JOIN asset_tree parent ON child.parent_id = parent.id
                    WHERE child.tenant_id = ${tenantId} AND child."deletedAt" IS NULL AND parent.depth < 20
                )
                SELECT id, tenant_id, parent_id, name, code, status, criticality, hierarchy_path, "description", image_url, loto_config, documents, specs, "createdAt", "updatedAt", "deletedAt"
                FROM asset_tree 
                ORDER BY depth ASC, name ASC;
            `;

            console.log(`[PERF] findSubtree took ${Date.now() - start}ms for root ${rootId}`);
            return rawResults.map(mapToDomain);
        } catch (error) {
            console.error(`[ERROR] findSubtree failed for root ${rootId}:`, error);
            throw error;
        }
    }

    async findAncestors(assetId: string, tenantId: string): Promise<Asset[]> {
        // [ARCH] Recursive CTE for Bottom-Up Retrieval (Leaf -> Root)
        const start = Date.now();
        try {
            const rawResults: any[] = await this.prisma.$queryRaw`
                WITH RECURSIVE ancestor_tree AS (
                    -- Base Case: The Leaf
                    SELECT id, tenant_id, parent_id, name, code, status, criticality, hierarchy_path, "description", image_url, loto_config, documents, specs, "createdAt", "updatedAt", "deletedAt", 0 as depth
                    FROM "Asset"
                    WHERE id = ${assetId} AND tenant_id = ${tenantId} AND "deletedAt" IS NULL
                    
                    UNION ALL
                    
                    -- Recursive Step: Parents
                    SELECT parent.id, parent.tenant_id, parent.parent_id, parent.name, parent.code, parent.status, parent.criticality, parent.hierarchy_path, parent."description", parent.image_url, parent.loto_config, parent.documents, parent.specs, parent."createdAt", parent."updatedAt", parent."deletedAt", child.depth + 1
                    FROM "Asset" parent
                    JOIN ancestor_tree child ON child.parent_id = parent.id
                    WHERE parent.tenant_id = ${tenantId} AND parent."deletedAt" IS NULL AND child.depth < 20
                )
                SELECT id, tenant_id, parent_id, name, code, status, criticality, hierarchy_path, "description", image_url, loto_config, documents, specs, "createdAt", "updatedAt", "deletedAt"
                FROM ancestor_tree 
                ORDER BY depth ASC; 
            `;
            console.log(`[PERF] findAncestors took ${Date.now() - start}ms for asset ${assetId}`);
            return rawResults.map(mapToDomain);
        } catch (error) {
            console.error(`[ERROR] findAncestors failed for asset ${assetId}:`, error);
            throw error;
        }
    }
}
