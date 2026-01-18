
"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { SuperAdminService, GlobalStats } from '@/services/super-admin.service';
import {
    Users,
    Building2,
    Wrench,
    Box,
    TrendingUp,
    Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuperAdminDashboard() {
    const { data: stats, isLoading } = useQuery<GlobalStats>({
        queryKey: ['super-admin-stats'],
        queryFn: () => SuperAdminService.getStats(),
        refetchInterval: 30000 // Refresh every 30s
    });

    if (isLoading) return <DashboardSkeleton />;

    const statCards = [
        { label: 'Total Tenants', value: stats?.counters.tenants, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Active Users', value: stats?.counters.users, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Work Orders', value: stats?.counters.workOrders, icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Total Assets', value: stats?.counters.assets, icon: Box, color: 'text-green-600', bg: 'bg-green-50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">The Architect's Nexus</h1>
                <p className="text-gray-500 mt-1">Platform-wide overview and orchestration hub.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <Card key={stat.label} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">{stat.label}</CardTitle>
                            <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                                <stat.icon size={18} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">{stat.value?.toLocaleString()}</div>
                            <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
                                <TrendingUp size={12} />
                                +{stats?.growth.newTenants30d} new this month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Platform Health */}
                <Card className="lg:col-span-2 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="text-blue-500" size={20} />
                            Platform Health
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg m-4 mt-0">
                        Visual Platform Health Metrics (API Latency, Error Rates) coming soon.
                    </CardContent>
                </Card>

                {/* Provisioning Feed */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Recent provisioning</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 italic">No recent log entries.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
            </div>
        </div>
    );
}
