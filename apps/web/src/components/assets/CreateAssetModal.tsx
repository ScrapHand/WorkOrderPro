"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CreateAssetModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    parentId?: string | null;
    parentName?: string;
    onSuccess: () => void;
}

type FormValues = {
    name: string;
    description: string;
    criticality: "A" | "B" | "C";
    parentId: string | null;
};

export function CreateAssetModal({ open, onOpenChange, parentId, parentName, onSuccess }: CreateAssetModalProps) {
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, reset, setValue } = useForm<FormValues>({
        defaultValues: {
            criticality: "C",
            parentId: parentId || null
        }
    });

    // Update parentId when it changes props
    // useEffect(() => setValue("parentId", parentId || null), [parentId, setValue]); 
    // Actually better to just pass it in submit or use hidden input logic if reactive.
    // simpler:
    const onSubmit = async (data: FormValues) => {
        try {
            setLoading(true);
            await api.post("/assets", {
                ...data, // name, description, criticality
                parentId: parentId // Ensure prompt parentId is used
            });
            toast.success("Asset created successfully");
            reset();
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Failed to create asset: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Asset</DialogTitle>
                    <DialogDescription>
                        {parentId ? `Adding child asset to ${parentName || "Parent"}` : "Adding a root asset"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Asset Name</Label>
                        <Input id="name" {...register("name", { required: true })} placeholder="e.g. Pump 101" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="criticality">Criticality</Label>
                        <Select onValueChange={v => setValue("criticality", v as "A" | "B" | "C")} defaultValue="C">
                            <SelectTrigger>
                                <SelectValue placeholder="Select criticality" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="A">A - Critical</SelectItem>
                                <SelectItem value="B">B - Important</SelectItem>
                                <SelectItem value="C">C - Routine</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" {...register("description")} placeholder="Optional details..." />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Asset"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
