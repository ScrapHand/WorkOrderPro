"use client";

import { useQuery } from "@tanstack/react-query";
import { ReportService } from "@/services/report.service";
import { useState } from "react";
import {
    Calendar,
    BarChart3,
    TrendingUp,
    Package,
    AlertCircle,
    Clock,
    Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ReportsPage() {
    const [startDate, setStartDate] = useState(
        new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: woSummary, isLoading: isWOLoading } = useQuery({
        queryKey: ["reports", "wo-summary", startDate, endDate],
        queryFn: () => ReportService.getWorkOrderSummary(startDate, endDate),
    });

    const { data: invSnapshot, isLoading: isInvLoading } = useQuery({
        queryKey: ["reports", "inventory-snapshot"],
        queryFn: () => ReportService.getInventorySnapshot(),
    });

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reporting Engine</h1>
                    <p className="text-muted-foreground">Analyze maintenance performance and inventory health.</p>
                </div>
                <Button variant="outline" onClick={() => window.print()}>
                    <Download className="mr-2 h-4 w-4" /> Export All (PDF)
                </Button>
            </header>

            {/* Date Picker Row */}
            <div className="flex items-end gap-4 bg-white p-4 rounded-xl border border-border/60 shadow-sm">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Start Date</label>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">End Date</label>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <div className="flex-1" />
                <div className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
                    <Clock className="h-3 w-3" /> Real-time data
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{woSummary?.total || 0}</div>
                        <p className="text-xs text-muted-foreground">In selected period</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. RIME Score</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{woSummary?.avgRime.toFixed(1) || "0.0"}</div>
                        <p className="text-xs text-muted-foreground">Priority x Asset Criticality</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inventory Health</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {invSnapshot ? Math.round(((invSnapshot.totalItems - invSnapshot.lowStockItems) / invSnapshot.totalItems) * 100) : 100}%
                        </div>
                        <p className="text-xs text-muted-foreground">{invSnapshot?.lowStockItems || 0} items low stock</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {woSummary ? Math.round(((woSummary.byStatus['DONE'] || 0) / woSummary.total) * 100 || 0) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Orders marked as DONE</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* WO Status Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Work Order Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {woSummary && Object.entries(woSummary.byStatus).map(([status, count]) => (
                                <div key={status} className="flex items-center">
                                    <div className="w-[100px] text-sm font-medium">{status}</div>
                                    <div className="flex-1 relative h-4 bg-muted rounded-full overflow-hidden mx-2">
                                        <div
                                            className="absolute left-0 top-0 h-full bg-primary"
                                            style={{ width: `${(count / woSummary.total) * 100}%` }}
                                        />
                                    </div>
                                    <div className="w-[30px] text-right text-sm text-muted-foreground">{count}</div>
                                </div>
                            ))}
                            {(!woSummary || woSummary.total === 0) && <p className="text-sm text-muted-foreground italic">No data available for this range</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Stock Check (Summary) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Critical Stock Checklist</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {invSnapshot?.items.filter(i => i.status !== 'OK').map((item) => (
                                <div key={item.name} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-2 w-2 rounded-full ${item.status === 'OUT' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-xs bg-muted px-2 py-1 rounded lowercase">
                                        Qty: {item.quantity} ({item.status})
                                    </span>
                                </div>
                            ))}
                            {invSnapshot?.lowStockItems === 0 && <p className="text-sm text-muted-foreground italic">All inventory levels are healthy</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

