"use client";

import { useQuery } from "@tanstack/react-query";
import { AnalyticsService } from "@/services/analytics.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClipboardList, CheckCircle2, AlertTriangle, Box, TrendingUp, Activity } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function AnalyticsPage() {
    const { config } = useTheme();

    // Fetch Stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ["analytics-stats"],
        queryFn: AnalyticsService.getStats,
        refetchInterval: 30000 // Refresh every 30s
    });

    if (isLoading) {
        return <div className="p-8 space-y-4">
            <div className="h-8 w-48 bg-muted/20 animate-pulse rounded" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-xl" />)}
            </div>
        </div>;
    }

    if (!stats) return <div className="p-8">Failed to load analytics.</div>;

    const completionRate = stats.totalWorkOrders > 0
        ? Math.round((stats.completedWorkOrders / stats.totalWorkOrders) * 100)
        : 0;

    const primaryColor = config?.branding?.primaryColor || "#3b82f6";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
                <p className="text-muted-foreground">Real-time insights into your operations.</p>
            </div>

            {/* KPI Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalWorkOrders}</div>
                        <p className="text-xs text-muted-foreground">
                            All time records
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completionRate}%</div>
                        <div className="w-full bg-secondary h-1.5 mt-2 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${completionRate}%`, backgroundColor: primaryColor }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
                        <Box className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalAssets}</div>
                        <p className="text-xs text-muted-foreground">
                            Registered in system
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                        <AlertTriangle className={`h-4 w-4 ${stats.lowStockItems > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.lowStockItems > 0 ? 'text-red-600' : ''}`}>
                            {stats.lowStockItems}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Items below minimum quantity
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Sections */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Work Order Health</CardTitle>
                        <CardDescription>
                            Breakdown of active vs completed jobs
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="flex items-center justify-center p-8 space-x-12">
                            {/* Custom CSS Donut Chart */}
                            <div className="relative h-40 w-40">
                                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                    <path
                                        className="text-muted/20"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3.8"
                                    />
                                    <path
                                        className="text-primary transition-all duration-1000 ease-out"
                                        style={{ color: primaryColor }}
                                        strokeDasharray={`${completionRate}, 100`}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3.8"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold">{stats.completedWorkOrders}</span>
                                    <span className="text-xs text-muted-foreground uppercase">Completed</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Completed</span>
                                        <span className="text-xs text-muted-foreground">{stats.completedWorkOrders} jobs</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-muted/20" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Open / Pending</span>
                                        <span className="text-xs text-muted-foreground">{stats.totalWorkOrders - stats.completedWorkOrders} jobs</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>System Activity</CardTitle>
                        <CardDescription>
                            Recent operational metrics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            <div className="flex items-center">
                                <Activity className="h-9 w-9 text-blue-500 bg-blue-50 p-2 rounded-full mr-4" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        System Efficiency
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Based on completion times
                                    </p>
                                </div>
                                <div className="ml-auto font-medium">Calculated</div>
                            </div>

                            <div className="flex items-center">
                                <Box className="h-9 w-9 text-green-500 bg-green-50 p-2 rounded-full mr-4" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        Asset Utilization
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Active assets vs maintenance
                                    </p>
                                </div>
                                <div className="ml-auto font-medium">
                                    {stats.totalAssets > 0
                                        ? Math.round(((stats.totalAssets - (stats.totalWorkOrders - stats.completedWorkOrders)) / stats.totalAssets) * 100)
                                        : 0}%
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
