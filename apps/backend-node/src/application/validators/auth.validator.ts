import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    tenant_slug: z.string().optional()
});

export const createAssetSchema = z.object({
    name: z.string().min(2).max(100),
    code: z.string().optional(),
    description: z.string().optional(),
    parentId: z.string().uuid().nullable().optional(),
    status: z.enum(['OPERATIONAL', 'DOWN', 'MAINTENANCE']).optional(),
    criticality: z.enum(['A', 'B', 'C']).optional()
});

export const presignSchema = z.object({
    entityType: z.enum(['assets', 'work-orders', 'tenant', 'inventory']),
    entityId: z.string().min(1),
    fileName: z.string().min(1),
    mimeType: z.string().regex(/^image\/|^application\/pdf$/) // Restrict to images/pdfs
});
