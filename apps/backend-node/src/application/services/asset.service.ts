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
        lotoConfig?: any | null
    ): Promise<Asset> {
        // [DOMAIN LOGIC] Hierarchy Path Calculation
        let hierarchyPath = '/';
        if (parentId) {
            const parent = await this.assetRepo.findById(parentId, tenantId);
            if (!parent) throw new Error('Parent asset not found');
            hierarchyPath = parent.hierarchyPath === '/' ? `/${parent.id}` : `${parent.hierarchyPath}/${parent.id}`;
        }

        const newAsset = new Asset(
            uuidv4(),
            tenantId,
            name,
            'OPERATIONAL',
            criticality,
            hierarchyPath,
            parentId,
            description,
            imageUrl,
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
