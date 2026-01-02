"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { Trash2, Search, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@/lib/auth/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const RimeBadge = ({ score }: { score: number }) => {
    let color = "bg-green-100 text-green-800 border-green-200";
    if (score >= 70) color = "bg-red-100 text-red-800 border-red-200";
    else if (score >= 40) color = "bg-orange-100 text-orange-800 border-orange-200";
    else if (score >= 20) color = "bg-yellow-100 text-yellow-800 border-yellow-200";

    return (
        <span className={`px-2 py-0.5 rounded border font-bold text-xs ${color}`}>
            {score}
        </span>
    );
};

interface WorkOrderTableProps {
    statusFilter?: string; // Optional filtering (e.g. 'DONE')
    filterMode?: 'me' | 'all';
}

export function WorkOrderTable({ statusFilter, filterMode = 'all' }: WorkOrderTableProps) {
    const router = useRouter();
    const queryClient = useQueryClient();

    // Pass status directly to the API if provided
    // NOTE: If filterMode is 'me', we might handle that client-side or add another API param later.
    const { data: orders, isLoading } = useQuery({
        queryKey: ["workOrders", statusFilter],
        queryFn: () => AssetService.getWorkOrders(statusFilter),
        refetchInterval: 30000,
    });

    const deleteMutation = useMutation({
        mutationFn: AssetService.deleteWorkOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workOrders"] });
            toast.success("Work Order deleted");
        },
        onError: () => toast.error("Failed to delete Work Order")
    });

    // Client-side filtering for 'me' or search could go here
    // For 'Archive', statusFilter='DONE' handles the main logic via Backend.
    const filteredOrders = orders?.filter(wo => {
        // Double check status if needed (though backend filters it)
        if (statusFilter && wo.status !== statusFilter) return false;

        // 'Me' filter would need userId check, omitted for now or done via specific API endpoint
        return true;
    });

    return (
        <div className="space-y-4">
            {/* Simple Filter Bar */}
            <div className="flex items-center gap-4 bg-white p-3 rounded-xl border shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-9 h-10 border-none focus-visible:ring-0" />
                </div>
                {filterMode === 'me' && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        My Tasks
                    </Badge>
                )}
            </div>

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="w-[80px]">RIME</TableHead>
                            <TableHead>Work Order</TableHead>
                            <TableHead>Asset</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Created</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [1, 2, 3].map(i => (
                                <TableRow key={i}>
                                    <TableCell colSpan={7} className="h-16 bg-muted/5 animate-pulse" />
                                </TableRow>
                            ))
                        ) : filteredOrders?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-64 text-center text-muted-foreground italic">
                                    {filterMode === 'me' ? "No tasks assigned to you." : "No work orders found."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders?.map(wo => (
                                <TableRow
                                    key={wo.id}
                                    className="group cursor-pointer hover:bg-blue-50/30 transition-colors"
                                    onClick={() => router.push(`/dashboard/work-orders/${wo.id}`)}
                                >
                                    <TableCell>
                                        <RimeBadge score={wo.rimeScore} />
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{wo.title}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">WO-{wo.id.slice(0, 8)}</div>
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                        {wo.asset?.name || "Global"}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${wo.priority === 'CRITICAL' ? 'text-red-600' : 'text-gray-500'}`}>
                                            {wo.priority}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 px-2 py-0 h-5">
                                            {wo.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground tabular-nums text-sm">
                                        {new Date(wo.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <RoleGuard allowedRoles={[UserRole.ADMIN]}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm("Are you sure you want to delete this Work Order?")) {
                                                        deleteMutation.mutate(wo.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </RoleGuard>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
