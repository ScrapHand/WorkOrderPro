"use client";

import { WorkOrderTable } from "@/components/work-orders/WorkOrderTable";
import { Archive } from "lucide-react";

export default function ArchivePage() {
    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Archive className="h-6 w-6 text-gray-400" />
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Archived Jobs</h1>
                    </div>
                    <p className="text-muted-foreground">History of completed work orders.</p>
                </div>
            </header>

            <WorkOrderTable
                statusFilter="DONE"
            />
        </div>
    );
}
