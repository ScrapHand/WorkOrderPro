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
    entityType: z.string().min(1), // Relaxed to allow aliases like 'asset', 'avatar', etc.
    entityId: z.string().optional(), // Allow missing ID for new entries
    fileName: z.string().min(1),
    mimeType: z.string().regex(/^image\/|^application\/pdf$/) // Restrict to images/pdfs
});

export const createWorkOrderSchema = z.object({
    assetId: z.string().uuid(),
    title: z.string().min(3).max(200),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    assignedUserId: z.string().uuid().optional().nullable(),
    assignedToMe: z.boolean().optional()
});

export const updateWorkOrderSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'CANCELLED']).optional(),
    assignedUserId: z.string().uuid().optional().nullable(),
    completionNotes: z.string().optional()
});

export const createTenantSchema = z.object({
    name: z.string().min(2).max(100),
    slug: z.string().regex(/^[a-z0-9-]+$/).min(2).max(50),
    adminEmail: z.string().email(),
    maxUsers: z.number().int().min(1).default(5),
    maxAdmins: z.number().int().min(1).default(1)
});

export const updateTenantSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    maxUsers: z.number().int().min(1).optional(),
    maxAdmins: z.number().int().min(1).optional(),
    plan: z.string().optional()
});
