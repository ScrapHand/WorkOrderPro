"use client";

import { useQuery } from "@tanstack/react-query";
import { ReportService } from "@/services/report.service";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Package,
    AlertCircle,
    Clock,
    Download,
    CheckCircle2,
    FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip } from "recharts";

export default function ReportsPage() {
    const { data: summary, isLoading: isSummaryLoading } = useQuery({
        queryKey: ["report-summary-global"],
        queryFn: () => ReportService.getWorkOrderSummary(),
        refetchInterval: 30000,
    });

    const { data: advanced, isLoading: isAdvancedLoading } = useQuery({
        queryKey: ["report-advanced-global"],
        queryFn: () => ReportService.getAdvancedMetrics(),
        refetchInterval: 30000,
    });

    const { data: trends, isLoading: isTrendsLoading } = useQuery({
        queryKey: ["report-trends-global"],
        queryFn: () => ReportService.getTrends(),
        refetchInterval: 30000,
    });

    const { data: invSnapshot, isLoading: isInvLoading } = useQuery({
        queryKey: ["reports", "inventory-snapshot"],
        queryFn: () => ReportService.getInventorySnapshot(),
    });

    const isLoading = isSummaryLoading || isAdvancedLoading || isTrendsLoading || isInvLoading;

    if (isLoading) {
        return <div className="p-8 flex items-center justify-center">Loading Analytics...</div>;
    }

    const mtbfTrendValue = trends?.mtbfTrend || 0;
    const mttrTrendValue = trends?.mttrTrend || 0;

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                    <p className="text-muted-foreground">High-fidelity operational and reliability metrics.</p>
                </div>
                <Button variant="outline" onClick={() => window.print()}>
                    <Download className="mr-2 h-4 w-4" /> Export Report
                </Button>
            </header>

            {/* Metric Overview Grid */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.total || 0}</div>
                        <p className="text-xs text-muted-foreground">All time volume</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">PM Compliance</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{advanced?.pmCompliance.score || 0}%</div>
                        <p className="text-xs text-muted-foreground">Completion of scheduled PMs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inventory Health</CardTitle>
                        <Package className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{invSnapshot?.totalItems || 0}</div>
                        <p className="text-xs text-muted-foreground">Tracked stock items</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. MTBF</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {advanced?.mtbf.length ? (advanced.mtbf.reduce((a: number, b: any) => a + b.mtbfDays, 0) / advanced.mtbf.length).toFixed(1) : "0"}d
                        </div>
                        <div className={`flex items-center text-xs mt-1 ${mtbfTrendValue >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {mtbfTrendValue >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            <span>{mtbfTrendValue >= 0 ? "+" : ""}{mtbfTrendValue}% vs last month</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. MTTR</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{advanced?.mttr.averageMinutes || 0}m</div>
                        <div className={`flex items-center text-xs mt-1 ${mttrTrendValue >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {mttrTrendValue >= 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                            <span>{mttrTrendValue >= 0 ? "+" : ""}{mttrTrendValue}% faster vs last month</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Trend & Detailed Analytics Section */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* 12-Month Reliability Trajectory Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Reliability Trajectory (12 Months)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trends?.history || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <ChartTooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="failures"
                                        stroke="#f97316"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#f97316' }}
                                        activeDot={{ r: 6 }}
                                        name="Failures"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="mttr"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        name="MTTR (min)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4 italic">
                            Trend shows monthly breakdown frequency (Orange) and repair efficiency (Blue).
                        </p>
                    </CardContent>
                </Card>

                {/* Advanced Analytics: Cost by Manufacturer */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Cost of Ownership by Manufacturer</span>
                            <span className="text-xs font-normal text-muted-foreground">Total Parts Cost</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {advanced?.costByManufacturer.map((item) => (
                                <div key={item.manufacturer} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{item.manufacturer || "Other/Unspecified"}</span>
                                        <span className="font-mono text-blue-600">£{item.totalCost.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{
                                                width: `${(item.totalCost / (advanced?.costByManufacturer.reduce((acc: number, curr: any) => acc + curr.totalCost, 0) || 1)) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">{item.count} work orders</div>
                                </div>
                            ))}
                            {advanced?.costByManufacturer.length === 0 && <p className="text-sm text-muted-foreground italic">No cost data found.</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Asset Reliability (MTBF) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Asset Reliability (MTBF)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {advanced?.mtbf.map((item) => (
                                <div key={item.assetId} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{item.assetName}</span>
                                        <span className="text-[10px] text-muted-foreground">{item.failureCount} Failures</span>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-bold ${item.mtbfDays < 30 ? 'text-red-600' : 'text-green-600'}`}>
                                            {item.mtbfDays.toFixed(1)} Days
                                        </div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">MTBF</div>
                                    </div>
                                </div>
                            ))}
                            {advanced?.mtbf.length === 0 && <p className="text-sm text-muted-foreground italic">No failure data available to calculate MTBF.</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* WO Status Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Work Order Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {summary && Object.entries(summary.byStatus).map(([status, count]) => (
                                <div key={status} className="flex items-center">
                                    <div className="w-[100px] text-sm font-medium">{status}</div>
                                    <div className="flex-1 relative h-4 bg-muted rounded-full overflow-hidden mx-2">
                                        <div
                                            className="absolute left-0 top-0 h-full bg-primary"
                                            style={{ width: `${(count / summary.total) * 100}%` }}
                                        />
                                    </div>
                                    <div className="w-[30px] text-right text-sm text-muted-foreground">{count}</div>
                                </div>
                            ))}
                            {(!summary || summary.total === 0) && <p className="text-sm text-muted-foreground italic">No data available</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Stock Check (Summary) */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Critical Stock Checklist</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {invSnapshot?.items.filter(i => i.status !== 'OK').slice(0, 9).map((item) => (
                                <div key={item.name} className="flex items-center justify-between border p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-2 w-2 rounded-full ${item.status === 'OUT' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-xs bg-muted px-2 py-1 rounded lowercase">
                                        Qty: {item.quantity}
                                    </span>
                                </div>
                            ))}
                            {invSnapshot?.lowStockItems === 0 && <p className="text-sm text-muted-foreground italic col-span-3 text-center py-8">All inventory levels are healthy</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
