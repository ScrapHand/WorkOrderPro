export interface InventoryItem {
    id: string;
    tenantId: string;
    name: string;
    quantity: number;
    threshold: number;
    locationId?: string | null;
    imageUrl?: string | null;
    supplierInfo?: {
        name: string;
        contact: string;
    } | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateInventoryItemDTO {
    name: string;
    quantity: number;
    threshold: number;
    locationId?: string;
    imageUrl?: string;
    supplierInfo?: any;
}
