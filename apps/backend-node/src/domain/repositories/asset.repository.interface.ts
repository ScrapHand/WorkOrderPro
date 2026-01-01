import { Asset } from '../entities/asset.entity';

export interface IAssetRepository {
    create(asset: Asset): Promise<void>;
    update(asset: Asset): Promise<void>;
    findById(id: string, tenantId: string): Promise<Asset | null>;
    /**
     * Finds the full subtree using Recursive CTEs.
     * @param rootId ID of the root asset
     * @param tenantId Tenant context
     */
    findSubtree(rootId: string, tenantId: string): Promise<Asset[]>;

    /**
     * Finds immediate children (for lazy load).
     */
    findChildren(parentId: string, tenantId: string): Promise<Asset[]>;

    /**
     * Finds the chain of ancestors from leaf to root.
     * @param assetId Leaf ID
     * @param tenantId Tenant context
     */
    findAncestors(assetId: string, tenantId: string): Promise<Asset[]>;
    findAll(tenantId: string): Promise<Asset[]>;
}
