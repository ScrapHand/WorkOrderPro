"use client";

import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PMService, PMSchedule } from "@/services/pm.service";
import { AssetService } from "@/services/asset.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Asset } from "@/types/asset";
import { useEffect } from "react";
import { format } from "date-fns";

interface CreatePMScheduleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialDate?: Date;
    onSuccess?: () => void;
}

export function CreatePMScheduleDialog({ open, onOpenChange, initialDate, onSuccess }: CreatePMScheduleDialogProps) {
    const queryClient = useQueryClient();
    const { data: assets } = useQuery({
        queryKey: ["assets-all"],
        queryFn: () => AssetService.getAll()
    });

    const { register, handleSubmit, setValue, reset, watch } = useForm<Partial<PMSchedule>>({
        defaultValues: {
            frequency: "MONTHLY",
            active: true
        }
    });

    useEffect(() => {
        if (open && initialDate) {
            setValue("startDate", format(initialDate, "yyyy-MM-dd"));
        }
    }, [open, initialDate, setValue]);

    const mutation = useMutation({
        mutationFn: (data: Partial<PMSchedule>) => PMService.createSchedule(data),
        onSuccess: () => {
            toast.success("PM Schedule created");
            queryClient.invalidateQueries({ queryKey: ["pm-schedules"] });
            onSuccess?.();
            onOpenChange(false);
            reset();
        },
        onError: (err: any) => {
            toast.error("Failed to create PM: " + (err.response?.data?.error || err.message));
        }
    });

    const onSubmit = (data: Partial<PMSchedule>) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create PM Schedule</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Schedule Title</Label>
                        <Input {...register("title", { required: true })} placeholder="e.g. Monthly Pump Inspection" />
                    </div>

                    <div className="space-y-2">
                        <Label>Asset</Label>
                        <Select onValueChange={(val) => setValue("assetId", val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select asset" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                {assets?.map((asset: Asset) => (
                                    <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Frequency</Label>
                            <Select onValueChange={(val) => setValue("frequency", val as any)} defaultValue="MONTHLY">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DAILY">Daily</SelectItem>
                                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                    <SelectItem value="YEARLY">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input type="date" {...register("startDate", { required: true })} />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Creating..." : "Create Schedule"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
