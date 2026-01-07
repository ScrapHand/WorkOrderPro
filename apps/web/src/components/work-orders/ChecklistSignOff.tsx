"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PMService, WorkOrderChecklist, WorkOrderChecklistItem } from "@/services/pm.service";
import { CheckCircle2, Circle, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface ChecklistSignOffProps {
    workOrderId: string;
}

export function ChecklistSignOff({ workOrderId }: ChecklistSignOffProps) {
    const queryClient = useQueryClient();

    const { data: checklist, isLoading } = useQuery({
        queryKey: ["wo-checklist", workOrderId],
        queryFn: () => PMService.getWorkOrderChecklist(workOrderId),
    });

    const signOffMutation = useMutation({
        mutationFn: ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) =>
            PMService.signOffItem(itemId, isCompleted),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wo-checklist", workOrderId] });
            toast.success("Checklist item updated.");
        },
        onError: () => {
            toast.error("Failed to update checklist item.");
        }
    });

    if (isLoading) {
        return <div className="py-8 text-center text-muted-foreground animate-pulse">Loading checklist...</div>;
    }

    if (!checklist || checklist.items.length === 0) {
        return null;
    }

    const items = [...checklist.items].sort((a, b) => a.order - b.order);
    const completedCount = items.filter(i => i.isCompleted).length;
    const progress = (completedCount / items.length) * 100;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Maintenance Checklist
                </h3>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {completedCount} / {items.length} Tasks
                </span>
            </div>

            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div
                    className="bg-blue-600 h-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="grid gap-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all
                            ${item.isCompleted
                                ? 'bg-green-50/50 border-green-100 opacity-75'
                                : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm'
                            }
                        `}
                    >
                        <Checkbox
                            id={item.id}
                            checked={item.isCompleted}
                            onCheckedChange={(checked) => {
                                signOffMutation.mutate({
                                    itemId: item.id,
                                    isCompleted: !!checked
                                });
                            }}
                            className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                            <label
                                htmlFor={item.id}
                                className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer
                                    ${item.isCompleted ? 'line-through text-green-700' : 'text-gray-900'}
                                `}
                            >
                                {item.task}
                            </label>
                            {item.isCompleted && item.completedAt && (
                                <div className="flex items-center gap-2 text-[10px] text-green-600 font-medium">
                                    <Clock className="h-3 w-3" />
                                    <span>Signed off on {new Date(item.completedAt).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
