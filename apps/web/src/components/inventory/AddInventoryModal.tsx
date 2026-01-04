import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InventoryService } from "@/services/inventory.service";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import { Part } from "@/types/inventory";

const schema = z.object({
    name: z.string().min(1, "Name is required"),
    sku: z.string().optional(),
    cost: z.coerce.number().min(0, "Cost must be positive"),
    quantity: z.coerce.number().min(0, "Quantity must be positive"),
    minQuantity: z.coerce.number().min(0).default(5),
    binLocation: z.string().optional()
});

type FormData = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    partToEdit?: Part | null;
}

export function AddInventoryModal({ open, onOpenChange, partToEdit }: Props) {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as Resolver<FormData>,
        defaultValues: {
            cost: 0,
            quantity: 0,
            minQuantity: 5
        }
    });

    // Populate form when editing
    useEffect(() => {
        if (partToEdit) {
            setValue("name", partToEdit.name);
            setValue("sku", partToEdit.sku || "");
            setValue("cost", partToEdit.cost);
            setValue("quantity", partToEdit.quantity);
            setValue("minQuantity", partToEdit.minQuantity);
            setValue("binLocation", partToEdit.binLocation || "");
        } else {
            reset({
                name: "",
                sku: "",
                cost: 0,
                quantity: 0,
                minQuantity: 5,
                binLocation: ""
            });
        }
    }, [partToEdit, open, setValue, reset]);

    const mutation = useMutation({
        mutationFn: (data: FormData) => {
            if (partToEdit) {
                return InventoryService.update(partToEdit.id, data);
            }
            return InventoryService.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["parts"] });
            onOpenChange(false);
            reset();
        }
    });

    const onSubmit = (data: FormData) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{partToEdit ? "Edit Part" : "Add New Part"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Part Name</Label>
                        <Input id="name" {...register("name")} placeholder="e.g. Ball Bearing 608" />
                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="sku">SKU / Part Number</Label>
                        <Input id="sku" {...register("sku")} placeholder="Optional" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input id="quantity" type="number" {...register("quantity")} />
                            {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="minQuantity">Min Quantity</Label>
                            <Input id="minQuantity" type="number" {...register("minQuantity")} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="cost">Unit Cost ($)</Label>
                            <Input id="cost" type="number" step="0.01" {...register("cost")} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="binLocation">Bin Location</Label>
                            <Input id="binLocation" {...register("binLocation")} placeholder="e.g. A-12" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : (partToEdit ? "Save Changes" : "Create Part")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
