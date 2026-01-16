
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
    unit?: string;
    category?: string;
    manufacturer?: string;
    model?: string;
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
    unit?: string;
    category?: string;
    manufacturer?: string;
    model?: string;
}
