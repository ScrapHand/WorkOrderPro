"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { Plus, ArrowUpRight, Search, Filter, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

import { Suspense } from "react";

import { WorkOrderTable } from "@/components/work-orders/WorkOrderTable";

function WorkOrderListContent() {
    const searchParams = useSearchParams();
    const predefinedFilter = searchParams.get("assignee");

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        {predefinedFilter === 'me' ? "My Schedule" : "Work Orders"}
                    </h1>
                    <p className="text-muted-foreground">Manage active tasks and maintenance history.</p>
                </div>
                <Link href="/dashboard/work-orders/new">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> New Work Order
                    </button>
                </Link>
            </header>

            <WorkOrderTable
                // If filter is 'me', we pass 'me', logic inside table handles it
                filterMode={predefinedFilter === 'me' ? 'me' : 'all'}
                enableFilters={true}
            />
        </div>
    );
}

export default function WorkOrderList() {
    return (
        <Suspense fallback={<div className="p-8">Loading Work Orders...</div>}>
            <WorkOrderListContent />
        </Suspense>
    );
}

