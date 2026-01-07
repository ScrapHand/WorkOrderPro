"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { Trash2, Search, ArrowUpDown, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { useTerminology } from "@/hooks/use-terminology";
import { useRouter, useParams } from "next/navigation";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

type SortField = 'date' | 'priority' | 'status';
type SortOrder = 'asc' | 'desc';

export function WorkOrderTable({ statusFilter, filterMode = 'all', enableFilters = false }: WorkOrderTableProps) {
    const router = useRouter();
    const params = useParams();
    const tenantSlug = (params?.tenantSlug as string) || 'default';
    const queryClient = useQueryClient();
    const t = useTerminology();

    // Filter State
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // Sorting
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const { data: orders, isLoading } = useQuery({
        queryKey: ["workOrders", statusFilter, dateFrom, dateTo], // Removed generic asset filters from key
        queryFn: () => AssetService.getWorkOrders({
            status: statusFilter,
            from: dateFrom || undefined,
            to: dateTo || undefined
        }),
        refetchInterval: 15000,
    });

    const deleteMutation = useMutation({
        mutationFn: AssetService.deleteWorkOrder,
        onMutate: async (id) => {
            // Optimistic Update
            await queryClient.cancelQueries({ queryKey: ["workOrders"] });
            const previousOrders = queryClient.getQueryData(["workOrders", statusFilter, dateFrom, dateTo]);
            queryClient.setQueryData(["workOrders", statusFilter, dateFrom, dateTo], (old: any) => old?.filter((wo: any) => wo.id !== id));
            return { previousOrders };
        },
        onError: (err, id, context) => {
            queryClient.setQueryData(["workOrders", statusFilter, dateFrom, dateTo], context?.previousOrders);
            toast.error("Failed to delete Work Order");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["workOrders"] });
        }
    });

    // Client-side search filtering
    const filteredOrders = orders?.filter(wo => {
        // [ENHANCED] Search all relevant fields
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchesTitle = wo.title.toLowerCase().includes(term);
            const matchesDesc = wo.description?.toLowerCase().includes(term);
            const matchesAsset = wo.asset?.name.toLowerCase().includes(term);
            const matchesStatus = wo.status.toLowerCase().includes(term);
            const matchesPriority = wo.priority.toLowerCase().includes(term);
            const matchesId = wo.id.includes(term); // Allow partial UUID search

            if (!matchesTitle && !matchesDesc && !matchesAsset && !matchesStatus && !matchesPriority && !matchesId) {
                return false;
            }
        }
        return true;
    }).sort((a, b) => {
        // [ENHANCED] Sorting Logic
        let comparison = 0;

        switch (sortField) {
            case 'date':
                comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Default Desc
                break;
            case 'priority':
                const priorityMap = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
                comparison = (priorityMap[b.priority as keyof typeof priorityMap] || 0) - (priorityMap[a.priority as keyof typeof priorityMap] || 0);
                break;
            case 'status':
                comparison = a.status.localeCompare(b.status);
                break;
        }

        return sortOrder === 'asc' ? -comparison : comparison; // Flip for ASC (Default handling above is DESC-ish for Date/Priority)
    });

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-3 rounded-xl border shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`Search ${t.workOrders}, ${t.assets}, status, or details...`}
                            className="pl-9 h-10 border-none bg-muted/30 focus-visible:ring-0 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-10 gap-2 min-w-[100px]">
                                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                                    Sort: <span className="capitalize font-semibold">{sortField}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setSortField('date'); setSortOrder('desc'); }}>
                                    <Calendar className="mr-2 h-4 w-4" /> Date (Newest)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSortField('date'); setSortOrder('asc'); }}>
                                    <Calendar className="mr-2 h-4 w-4" /> Date (Oldest)
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setSortField('priority'); setSortOrder('desc'); }}> // High to Low
                                    <AlertTriangle className="mr-2 h-4 w-4" /> Priority (High-Low)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSortField('priority'); setSortOrder('asc'); }}>
                                    <AlertTriangle className="mr-2 h-4 w-4" /> Priority (Low-High)
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setSortField('status'); setSortOrder('asc'); }}>
                                    <CheckCircle className="mr-2 h-4 w-4" /> Status
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {filterMode === 'me' && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 h-10 px-3 hidden sm:flex items-center">
                                My Tasks
                            </Badge>
                        )}
                    </div>
                </div>

                {enableFilters && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t items-center">
                        <span className="text-xs font-semibold text-muted-foreground mr-2">Filters:</span>

                        <div className="flex items-center gap-1 border rounded px-2 bg-white py-1">
                            <span className="text-xs text-muted-foreground">From:</span>
                            <input
                                type="date"
                                className="h-6 text-xs bg-transparent outline-none text-gray-700"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1 border rounded px-2 bg-white py-1">
                            <span className="text-xs text-muted-foreground">To:</span>
                            <input
                                type="date"
                                className="h-6 text-xs bg-transparent outline-none text-gray-700"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                            />
                        </div>

                        {(dateFrom || dateTo) && (
                            <Button variant="ghost" size="sm" className="h-6 text-xs text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => {
                                setDateFrom("");
                                setDateTo("");
                            }}>
                                Clear Dates
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
                            <TableHead>{t.workOrder}</TableHead>
                            <TableHead>{t.asset}</TableHead>
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
                                    {searchTerm ? `No ${t.workOrders.toLowerCase()} match your search.` : (filterMode === 'me' ? "No tasks assigned to you." : `No ${t.workOrders.toLowerCase()} found.`)}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders?.map(wo => (
                                <TableRow
                                    key={wo.id}
                                    className="group cursor-pointer hover:bg-blue-50/30 transition-colors"
                                    onClick={() => router.push(`/${tenantSlug}/dashboard/work-orders/${wo.id}`)}
                                >
                                    <TableCell>
                                        <RimeBadge score={wo.rimeScore} />
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1">{wo.title}</div>
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
