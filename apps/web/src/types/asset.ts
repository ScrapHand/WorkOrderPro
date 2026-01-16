import { AssetStatus } from '@workorderpro/shared';
export type AssetCriticality = 'A' | 'B' | 'C';

export interface Asset {
    id: string;
    tenantId: string;
    parentId: string | null;
    name: string;
    code: string | null;
    description?: string;
    imageUrl?: string | null;
    lotoConfig?: {
        electrical?: string;
        pneumatic?: string;
        hydraulic?: string;
    } | null;
    documents?: { name: string; url: string; type: string }[];
    specs?: Record<string, string> | null;
    metadata?: { position?: { x: number; y: number } } | null;
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
    imageUrl?: string | null;
    lotoConfig?: any;
    criticality?: AssetCriticality;
}
