import { z } from "zod";

// Step 1: Asset Selection
const WizardAssetShape = z.object({
    assetId: z.string().uuid().optional(),
    provisionalAssetName: z.string().min(2, "Asset name must be at least 2 chars").max(100).optional(),
});

export const WizardAssetSchema = WizardAssetShape.refine(data => data.assetId || data.provisionalAssetName, {
    message: "Please select an asset or enter a provisional name.",
    path: ["assetId"]
});

// Step 2: Priority Selection
export const WizardPrioritySchema = z.object({
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

// Step 3: Details
export const WizardDetailsSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters."),
    description: z.string().optional(),
    assignedToMe: z.boolean().optional(),
});

// Combined Schema for Mutation
export const CreateWorkOrderSchema = WizardAssetShape
    .merge(WizardPrioritySchema)
    .merge(WizardDetailsSchema)
    .refine(data => data.assetId || data.provisionalAssetName, {
        message: "Please select an asset or enter a provisional name.",
        path: ["assetId"]
    });

export type WizardAssetValues = z.infer<typeof WizardAssetSchema>;
export type WizardPriorityValues = z.infer<typeof WizardPrioritySchema>;
export type WizardDetailsValues = z.infer<typeof WizardDetailsSchema>;
export type CreateWorkOrderValues = z.infer<typeof CreateWorkOrderSchema>;

// Aliases for other components (e.g. create-wizard.tsx)
export const workOrderSchema = CreateWorkOrderSchema;
export type WorkOrderCreate = CreateWorkOrderValues;
