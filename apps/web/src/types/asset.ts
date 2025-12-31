export type AssetStatus = 'OPERATIONAL' | 'DOWN' | 'MAINTENANCE';
export type AssetCriticality = 'A' | 'B' | 'C';

export interface Asset {
    id: string;
    tenantId: string;
    parentId: string | null;
    name: string;
    description?: string;
    status: AssetStatus;
    criticality: AssetCriticality;
    hierarchyPath: string;
    createdAt: string;
    updatedAt: string;
    children?: Asset[]; // For recursive tree structure
}

export interface CreateAssetDTO {
    name: string;
    parentId?: string | null;
    description?: string;
    criticality?: AssetCriticality;
}
