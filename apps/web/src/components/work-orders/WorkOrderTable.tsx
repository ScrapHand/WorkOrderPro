"use client";

import { useState } from "react";
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
    enableFilters?: boolean;
}

export function WorkOrderTable({ statusFilter, filterMode = 'all', enableFilters = false }: WorkOrderTableProps) {
    const router = useRouter();
    const queryClient = useQueryClient();

    // Filter State
    const [assetFilter, setAssetFilter] = useState("");
    const [groupFilter, setGroupFilter] = useState(""); // Root Asset ID
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // Debounce search term if needed, but for now direct passing is okay for small datasets
    // For large datasets, useDebounce is better.

    const { data: orders, isLoading } = useQuery({
        queryKey: ["workOrders", statusFilter, assetFilter, groupFilter, dateFrom, dateTo],
        queryFn: () => AssetService.getWorkOrders({
            status: statusFilter,
            assetId: assetFilter || undefined,
            rootAssetId: groupFilter || undefined,
            from: dateFrom || undefined,
            to: dateTo || undefined
        }),
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

    // Client-side search filtering
    const filteredOrders = orders?.filter(wo => {
        if (searchTerm && !wo.title.toLowerCase().includes(searchTerm.toLowerCase()) && !wo.work_order_number?.includes(searchTerm)) return false;
        return true;
    });

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-3 rounded-xl border shadow-sm space-y-3">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Work Orders..."
                            className="pl-9 h-10 border-none bg-muted/30 focus-visible:ring-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {filterMode === 'me' && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            My Tasks
                        </Badge>
                    )}
                </div>

                {enableFilters && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                        <Input
                            placeholder="Asset ID (UUID)"
                            className="w-[150px] h-8 text-xs"
                            value={assetFilter}
                            onChange={e => setAssetFilter(e.target.value)}
                        />
                        <Input
                            placeholder="Group / Root Asset ID"
                            className="w-[150px] h-8 text-xs"
                            value={groupFilter}
                            onChange={e => setGroupFilter(e.target.value)}
                        />
                        <div className="flex items-center gap-1 border rounded px-2 bg-muted/10">
                            <span className="text-xs text-muted-foreground">From:</span>
                            <input
                                type="date"
                                className="h-8 text-xs bg-transparent outline-none"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1 border rounded px-2 bg-muted/10">
                            <span className="text-xs text-muted-foreground">To:</span>
                            <input
                                type="date"
                                className="h-8 text-xs bg-transparent outline-none"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                            />
                        </div>
                        {(assetFilter || groupFilter || dateFrom || dateTo) && (
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-red-500" onClick={() => {
                                setAssetFilter("");
                                setGroupFilter("");
                                setDateFrom("");
                                setDateTo("");
                            }}>
                                Clear
                            </Button>
                        )}
                    </div>
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
