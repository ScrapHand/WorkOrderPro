import { PrismaClient } from '@prisma/client';
import { IAssetRepository } from '../../domain/repositories/asset.repository.interface';
import { Asset } from '../../domain/entities/asset.entity';

// Helper to map Prisma result to Domain Entity
const mapToDomain = (row: any): Asset => {
    return new Asset(
        row.id,
        row.tenant_id || row.tenantId,
        row.name,
        row.status as 'OPERATIONAL' | 'DOWN' | 'MAINTENANCE',
        row.criticality as 'A' | 'B' | 'C',
        row.hierarchy_path || row.hierarchyPath,
        row.parent_id || row.parentId,
        row.description,
        row.image_url || row.imageUrl,
        row.loto_config || row.lotoConfig,
        row.documents, // [FIX] Map documents
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
                description: asset.description,
                imageUrl: asset.imageUrl,
                lotoConfig: asset.lotoConfig,
                documents: asset.documents, // [FIX] Persist documents
                status: asset.status,
                criticality: asset.criticality,
                hierarchyPath: asset.hierarchyPath
            }
        });
    }

    async update(asset: Asset): Promise<void> {
        await this.prisma.asset.update({
            where: { id: asset.id },
            data: {
                name: asset.name,
                status: asset.status,
                criticality: asset.criticality,
                hierarchyPath: asset.hierarchyPath,
                imageUrl: asset.imageUrl,
                lotoConfig: asset.lotoConfig,
                documents: asset.documents, // [FIX] Persist documents
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
        // [ARCH] Recursive CTE for Deep Tree Retrieval
        // Note: SQLite syntax for Recursive CTE is standard SQL.
        // We select strictly columns needed.

        const rawResults: any[] = await this.prisma.$queryRaw`
            WITH RECURSIVE asset_tree AS (
                -- Base Case: The Root
                SELECT id, tenant_id, parent_id, name, status, criticality, hierarchy_path, "description", image_url, loto_config, documents, "createdAt", "updatedAt", "deletedAt", 0 as depth
                FROM "Asset"
                WHERE id = ${rootId} AND tenant_id = ${tenantId} AND "deletedAt" IS NULL
                
                UNION ALL
                
                -- Recursive Step: Direct Children
                SELECT child.id, child.tenant_id, child.parent_id, child.name, child.status, child.criticality, child.hierarchy_path, child."description", child.image_url, child.loto_config, child.documents, child."createdAt", child."updatedAt", child."deletedAt", parent.depth + 1
                FROM "Asset" child
                JOIN asset_tree parent ON child.parent_id = parent.id
                WHERE child.tenant_id = ${tenantId} AND child."deletedAt" IS NULL
            )
            SELECT * FROM asset_tree ORDER BY depth ASC, name ASC;
        `;

        return rawResults.map(mapToDomain);
    }

    async findAncestors(assetId: string, tenantId: string): Promise<Asset[]> {
        // [ARCH] Recursive CTE for Bottom-Up Retrieval (Leaf -> Root)
        const rawResults: any[] = await this.prisma.$queryRaw`
            WITH RECURSIVE ancestor_tree AS (
                -- Base Case: The Leaf
                SELECT id, tenant_id, parent_id, name, status, criticality, hierarchy_path, "description", image_url, loto_config, documents, "createdAt", "updatedAt", "deletedAt", 0 as depth
                FROM "Asset"
                WHERE id = ${assetId} AND tenant_id = ${tenantId} AND "deletedAt" IS NULL
                
                UNION ALL
                
                -- Recursive Step: Parents
                SELECT parent.id, parent.tenant_id, parent.parent_id, parent.name, parent.status, parent.criticality, parent.hierarchy_path, parent."description", parent.image_url, parent.loto_config, parent.documents, parent."createdAt", parent."updatedAt", parent."deletedAt", child.depth + 1
                FROM "Asset" parent
                JOIN ancestor_tree child ON child.parent_id = parent.id
                WHERE parent.tenant_id = ${tenantId} AND parent."deletedAt" IS NULL
            )
            SELECT * FROM ancestor_tree ORDER BY depth ASC; 
        `;
        // Depth 0 = Leaf, Depth N = Root
        return rawResults.map(mapToDomain);
    }
}
