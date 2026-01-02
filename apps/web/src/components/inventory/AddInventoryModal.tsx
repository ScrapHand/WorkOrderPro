"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InventoryService } from "@/services/inventory.service";
import { toast } from "sonner";
import { FileUploader } from "@/components/common/FileUploader";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(2, "Name is required"),
    quantity: z.coerce.number().min(0),
    threshold: z.coerce.number().min(0),
    locationId: z.string().optional(),
    supplierName: z.string().optional(),
    supplierContact: z.string().optional(),
    imageUrl: z.string().optional(),
});

interface AddInventoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddInventoryModal({ open, onOpenChange }: AddInventoryModalProps) {
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            quantity: 0,
            threshold: 5,
            locationId: "",
            supplierName: "",
            supplierContact: "",
            imageUrl: "",
        },
    });

    const createItem = useMutation({
        mutationFn: (values: z.infer<typeof formSchema>) => {
            const payload = {
                name: values.name,
                quantity: values.quantity,
                threshold: values.threshold,
                locationId: values.locationId || null,
                imageUrl: values.imageUrl || null,
                supplierInfo: values.supplierName ? {
                    name: values.supplierName,
                    contact: values.supplierContact || ""
                } : null
            };
            // @ts-ignore - DTO mismatch with undefined handling
            return InventoryService.create(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
            toast.success("Inventory item added");
            onOpenChange(false);
            form.reset();
        },
        onError: (error: any) => {
            toast.error("Failed to create item: " + error.message);
        }
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        createItem.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add Inventory Item</DialogTitle>
                    <DialogDescription>
                        Create a new stock item with tracking details.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Item Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Air Filter" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="locationId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location / Bin ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Shelf A-01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Initial Quantity</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="threshold"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Low Stock Threshold</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                            <div className="text-sm font-medium">Supplier Information</div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="supplierName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Supplier Name</FormLabel>
                                            <FormControl>
                                                <Input className="h-8" placeholder="e.g. Grainger" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="supplierContact"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Contact Info</FormLabel>
                                            <FormControl>
                                                <Input className="h-8" placeholder="Phone or Email" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Item Image</FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            <FileUploader
                                                entityType="inventory"
                                                entityId="temp" // In a real app we'd need ID first, or separate flow. 
                                                // For now, we rely on the uploader returning a URL that we bind.
                                                onUploadComplete={(file) => {
                                                    field.onChange(file.url);
                                                    setUploading(false);
                                                }}
                                            />
                                            {field.value && (
                                                <div className="text-xs text-green-600 flex items-center gap-2">
                                                    ✓ Image attached
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createItem.isPending || uploading}>
                                {createItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add to Inventory
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
