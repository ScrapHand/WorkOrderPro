"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
// Note: Shadcn `Switch` not installed yet, verifying in next step or using checkbox fallback.
// Using Checkbox for now as it's simpler or I can use native checkbox.
// Let's use native checkbox for speed or a simple custom toggle.

export function Step3Details() {
    const { register, formState: { errors } } = useFormContext();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-2">
                <Label htmlFor="title">Issue Title</Label>
                <Input
                    id="title"
                    placeholder="e.g. Conveyor Belt Stuck"
                    {...register("title")}
                />
                {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message as string}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                    id="description"
                    placeholder="Describe what happened, any funny noises, or error codes..."
                    className="min-h-[120px]"
                    {...register("description")}
                />
                {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message as string}</p>
                )}
            </div>

            <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg border">
                <input
                    type="checkbox"
                    id="assignedToMe"
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                    {...register("assignedToMe")}
                />
                <div className="flex flex-col">
                    <Label htmlFor="assignedToMe" className="cursor-pointer font-semibold">Assign to me</Label>
                    <span className="text-xs text-muted-foreground">I will start working on this immediately.</span>
                </div>
            </div>
        </div>
    );
}
