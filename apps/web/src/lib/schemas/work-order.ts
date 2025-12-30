import { z } from "zod";

// Step 1: Asset Selection
export const WizardAssetSchema = z.object({
    assetId: z.string().uuid({ message: "Please select an asset." }),
});

// Step 2: Priority Selection
export const WizardPrioritySchema = z.object({
    priority: z.enum(["low", "medium", "high", "critical"]),
});

// Step 3: Details
export const WizardDetailsSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters."),
    description: z.string().optional(),
    assignedToMe: z.boolean().optional(),
});

// Combined Schema for Mutation
export const CreateWorkOrderSchema = WizardAssetSchema
    .merge(WizardPrioritySchema)
    .merge(WizardDetailsSchema);

export type WizardAssetValues = z.infer<typeof WizardAssetSchema>;
export type WizardPriorityValues = z.infer<typeof WizardPrioritySchema>;
export type WizardDetailsValues = z.infer<typeof WizardDetailsSchema>;
export type CreateWorkOrderValues = z.infer<typeof CreateWorkOrderSchema>;

// Aliases for other components (e.g. create-wizard.tsx)
export const workOrderSchema = CreateWorkOrderSchema;
export type WorkOrderCreate = CreateWorkOrderValues;
