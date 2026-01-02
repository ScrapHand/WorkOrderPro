"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
// import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { FileUploader } from "@/components/common/FileUploader";
import { Asset } from "@/types/asset";
import { AssetService } from "@/services/asset.service";
import { useEffect } from "react";

interface CreateAssetModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    parentId?: string | null;
    parentName?: string;
    initialData?: Asset | null;
    onSuccess: () => void;
}

type FormValues = {
    name: string;
    description: string;
    criticality: "A" | "B" | "C";
    parentId: string | null;
    imageUrl?: string;
};

export function CreateAssetModal({ open, onOpenChange, parentId, parentName, initialData, onSuccess }: CreateAssetModalProps) {
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
        defaultValues: {
            criticality: "C",
            parentId: parentId || null,
            imageUrl: ""
        }
    });

    const imageUrl = watch("imageUrl");

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    description: initialData.description || "",
                    criticality: initialData.criticality,
                    parentId: initialData.parentId,
                    imageUrl: initialData.imageUrl || ""
                });
            } else {
                reset({
                    name: "",
                    description: "",
                    criticality: "C",
                    parentId: parentId || null,
                    imageUrl: ""
                });
            }
        }
    }, [open, initialData, parentId, reset]);

    const onSubmit = async (data: FormValues) => {
        try {
            setLoading(true);
            if (initialData) {
                await AssetService.update(initialData.id, data);
                toast.success("Asset updated successfully");
            } else {
                await AssetService.create({
                    ...data,
                    parentId: parentId || null
                });
                toast.success("Asset created successfully");
            }

            reset();
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Failed to save asset: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Asset" : "Add New Asset"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Update asset details and image." : (parentId ? `Adding child asset to ${parentName || "Parent"}` : "Adding a root asset")}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Asset Image</Label>
                            <div className="border border-dashed rounded-lg p-4 bg-muted/10 text-center">
                                {imageUrl ? (
                                    <div className="relative aspect-video w-full mb-2">
                                        <img src={imageUrl} alt="Preview" className="w-full h-full object-contain rounded" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-1 right-1 h-6 w-6 p-0"
                                            onClick={() => setValue("imageUrl", "")}
                                        >
                                            x
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="h-32 flex items-center justify-center text-muted-foreground text-xs">
                                        No Image
                                    </div>
                                )}
                                <FileUploader
                                    entityType="assets"
                                    entityId={initialData?.id} // [FIX] ID or undefined
                                    onUploadComplete={(file) => setValue("imageUrl", file.url)}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Asset Name</Label>
                                <Input id="name" {...register("name", { required: true })} placeholder="e.g. Pump 101" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="criticality">Criticality</Label>
                                <Select onValueChange={v => setValue("criticality", v as "A" | "B" | "C")} defaultValue={initialData?.criticality || "C"}>
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
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" {...register("description")} placeholder="Optional details..." />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : (initialData ? "Update Asset" : "Create Asset")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
