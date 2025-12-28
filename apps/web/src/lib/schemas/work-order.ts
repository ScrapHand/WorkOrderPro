import { z } from "zod";

export const workOrderPrioritySchema = z.enum(["low", "medium", "high", "critical"]);
export const workOrderStatusSchema = z.enum(["new", "in_progress", "waiting_parts", "completed"]);

export const workOrderSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100),
    description: z.string().min(1, "Description is required"),
    priority: workOrderPrioritySchema.default("medium"),
    asset_id: z.string().uuid("Invalid Asset ID"),
});

export type WorkOrderCreate = z.infer<typeof workOrderSchema>;

export type WorkOrder = WorkOrderCreate & {
    id: string;
    status: z.infer<typeof workOrderStatusSchema>;
    created_at: string;
    updated_at: string;
};
