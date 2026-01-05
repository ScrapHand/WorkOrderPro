import { Asset } from '../../domain/entities/asset.entity';
import { IAssetRepository } from '../../domain/repositories/asset.repository.interface';
import { v4 as uuidv4 } from 'uuid'; // Need to install uuid

export class AssetService {
    constructor(private assetRepo: IAssetRepository) { }

    async createAsset(
        tenantId: string,
        name: string,
        parentId: string | null,
        description?: string,
        criticality: 'A' | 'B' | 'C' = 'C',
        imageUrl?: string | null,
        lotoConfig?: any | null,
        code?: string | null
    ): Promise<Asset> {
        const id = uuidv4();

        // [DOMAIN LOGIC] Hierarchy Path Calculation
        let hierarchyPath = `/${id}`;
        if (parentId) {
            const parent = await this.assetRepo.findById(parentId, tenantId);
            if (!parent) throw new Error('Parent asset not found');
            // If parent is from old system/root, it might have '/' as path.
            // But we want it to be /PARENT_ID/ID
            const parentPath = parent.hierarchyPath === '/' ? `/${parent.id}` : parent.hierarchyPath;
            hierarchyPath = `${parentPath}/${id}`;
        }

        const newAsset = new Asset(
            id,
            tenantId,
            name,
            code || null,
            'OPERATIONAL',
            criticality,
            hierarchyPath,
            parentId,
            description,
            imageUrl,
            lotoConfig,
            null // documents
        );

        await this.assetRepo.create(newAsset);
        return newAsset;
    }

    async getAssetTree(rootId: string, tenantId: string): Promise<Asset[]> {
        return this.assetRepo.findSubtree(rootId, tenantId);
    }

    async getAllAssets(tenantId: string): Promise<Asset[]> {
        return this.assetRepo.findAll(tenantId);
    }
}
