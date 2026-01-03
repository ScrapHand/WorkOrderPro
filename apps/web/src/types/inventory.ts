
export interface Part {
    id: string;
    tenantId: string;
    name: string;
    sku?: string;
    description?: string;
    cost: number;
    quantity: number;
    minQuantity: number;
    binLocation?: string;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePartDTO {
    name: string;
    sku?: string;
    cost: number;
    quantity: number;
    minQuantity?: number;
    binLocation?: string;
}
