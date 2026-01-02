"use client";

import { useQuery } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { Plus, ArrowUpRight, Search, Filter } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
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

export default function WorkOrderList() {
    const router = useRouter();
    const { data: orders, isLoading } = useQuery({
        queryKey: ["workOrders"],
        queryFn: AssetService.getWorkOrders,
        refetchInterval: 30000, // [UX] Auto-refresh every 30s
    });

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Work Orders</h1>
                    <p className="text-muted-foreground">Manage active tasks and maintenance history.</p>
                </div>
                <Link href="/dashboard/work-orders/new">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> New Work Order
                    </button>
                </Link>
            </header>

            <div className="flex items-center gap-4 bg-white p-3 rounded-xl border shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Filter by ID, title, or asset..." className="pl-9 h-10 border-none focus-visible:ring-0" />
                </div>
                <div className="flex-1" />
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-transparent hover:border-border transition-all">
                    <Filter className="h-4 w-4" /> Filters
                </button>
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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [1, 2, 3].map(i => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6} className="h-16 bg-muted/5 animate-pulse" />
                                </TableRow>
                            ))
                        ) : orders?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center text-muted-foreground italic">
                                    No work orders found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders?.map(wo => (
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
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

