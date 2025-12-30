import { z } from "zod";

// Step 1: Asset Selection
export const WizardAssetSchema = z.object({
    assetId: z.string().uuid({ message: "Please select an asset." }),
});

// Step 2: Priority Selection
export const WizardPrioritySchema = z.object({
    priority: z.enum(["low", "medium", "high", "critical"], {
        required_error: "Please select a priority.",
    }),
});

// Step 3: Details
export const WizardDetailsSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters."),
    description: z.string().optional(),
    assignedToMe: z.boolean().default(true),
});

// Combined Schema for Mutation
export const CreateWorkOrderSchema = WizardAssetSchema
    .merge(WizardPrioritySchema)
    .merge(WizardDetailsSchema)
    .transform((data) => ({
        // Transform specifically for backend payload
        asset_id: data.assetId,
        priority: data.priority,
        title: data.title,
        description: data.description,
        status: "new",
        // Backend handles assignment based on user context if we don't send it,
        // or we might need to send current user ID if assignedToMe is true.
        // For now, let's assume we handle assignment logic in the mutation or backend default.
    }));

export type WizardAssetValues = z.infer<typeof WizardAssetSchema>;
export type WizardPriorityValues = z.infer<typeof WizardPrioritySchema>;
export type WizardDetailsValues = z.infer<typeof WizardDetailsSchema>;
export type CreateWorkOrderValues = z.infer<typeof CreateWorkOrderSchema>;
