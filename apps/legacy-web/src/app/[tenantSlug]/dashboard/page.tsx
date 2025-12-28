"use client";
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
    Plus,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    Clock,
    ArrowRight,
    AlertTriangle,
    Boxes,
    PauseCircle
} from 'lucide-react';
import { useTenant } from '@/context/TenantContext';

interface DashboardStats {
    activeTotal: number;
    woByStatus: Record<string, number>;
    lowStockCount: number;
    assetCount: number;
    healthyAssetCount: number;
}

interface WorkOrder {
    id: string;
    work_order_number?: string;
    title: string;
    status: string;
    priority: string;
    created_at: string;
}

interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    min_quantity: number;
    unit: string;
}

export default function DashboardPage() {
    const { tenant } = useTenant();
    const [stats, setStats] = useState<DashboardStats>({
        activeTotal: 0,
        woByStatus: {},
        lowStockCount: 0,
        assetCount: 0,
        healthyAssetCount: 0
    });
    const [recentJobs, setRecentJobs] = useState<WorkOrder[]>([]);
    const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [woStatsRes, woRes, invRes, assetRes] = await Promise.all([
                    api.get('/work-orders/stats'),
                    api.get('/work-orders/?limit=5'),
                    api.get('/inventory/'),
                    api.get('/assets/')
                ]);

                const inventory: InventoryItem[] = invRes.data;
                const lowStock = inventory.filter(item => item.quantity <= item.min_quantity);

                const healthyAssets = assetRes.data.filter((a: any) => a.status === 'Healthy');

                setStats({
                    activeTotal: woStatsRes.data.active_total,
                    woByStatus: woStatsRes.data.by_status,
                    lowStockCount: lowStock.length,
                    assetCount: assetRes.data.length,
                    healthyAssetCount: healthyAssets.length
                });

                const activeJobs = woRes.data.filter((job: WorkOrder) => {
                    return job.status !== 'completed' && job.status !== 'cancelled';
                });

                setRecentJobs(activeJobs);
                setLowStockItems(lowStock);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-muted">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="font-medium animate-pulse">Initializing Dashboard...</p>
            </div>
        );
    }

    const StatCard = ({ title, value, color, icon: Icon, trend }: { title: string, value: number | string, color: string, icon: React.ElementType, trend?: string }) => (
        <div className="glass-panel p-6 industrial-gradient group hover:border-primary/30 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-opacity-10 ${color.replace('text-', 'bg-')} border border-white/5`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
                {trend && (
                    <span className="text-[10px] font-bold text-success flex items-center gap-1 bg-success/10 px-2 py-1 rounded-full">
                        <TrendingUp className="w-3 h-3" /> {trend}
                    </span>
                )}
            </div>
            <h3 className="text-muted text-xs font-bold uppercase tracking-widest">{title}</h3>
            <p className="text-4xl font-black mt-1 text-white tracking-tight">{value}</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase leading-none">{tenant?.theme_json?.naming?.systemTitle || "Operations"}</h1>
                    <p className="text-muted font-medium mt-1 text-sm">Real-time facility intelligence & asset health</p>
                </div>
                <Link href="work-orders/new" className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 text-xs lg:text-sm">
                    <Plus className="w-5 h-5" />
                    CREATE {tenant?.theme_json?.naming?.workOrdersLabel?.toUpperCase().slice(0, -1) || "WORK ORDER"}
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={`Active ${tenant?.theme_json?.naming?.workOrdersLabel || "Tasks"}`}
                    value={(stats.woByStatus['new'] || 0) + (stats.woByStatus['in_progress'] || 0)}
                    color="text-secondary"
                    icon={Clock}
                />
                <StatCard
                    title="On Hold / Waiting"
                    value={(stats.woByStatus['on_hold'] || 0) + (stats.woByStatus['waiting_parts'] || 0)}
                    color="text-orange-500"
                    icon={PauseCircle}
                />
                <StatCard
                    title="Completed Today"
                    value={stats.woByStatus['completed'] || 0}
                    color="text-success"
                    icon={CheckCircle2}
                />
                <StatCard
                    title={`${tenant?.theme_json?.naming?.assetsLabel?.slice(0, -1) || "Asset"} Health`}
                    value={`${stats.assetCount > 0 ? Math.round((stats.healthyAssetCount / stats.assetCount) * 100) : 0}%`}
                    color="text-warning"
                    icon={Boxes}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Jobs */}
                <div className="lg:col-span-2 glass-panel overflow-hidden border-white/5 shadow-2xl">
                    <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-6 bg-primary rounded-full"></div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Active {tenant?.theme_json?.naming?.workOrdersLabel || "Deployments"}</h2>
                        </div>
                        <Link href="work-orders" className="text-xs font-bold text-primary hover:text-primary-hover uppercase tracking-widest flex items-center gap-1 group">
                            Full Log <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="divide-y divide-white/5">
                        {recentJobs.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-muted font-medium italic">Scanning for active orders... None detected.</p>
                            </div>
                        ) : (
                            recentJobs.map(job => (
                                <Link key={job.id} href={`work-orders/${job.id}`} className="block px-6 lg:px-8 py-5 hover:bg-white/5 transition-all group">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="space-y-1">
                                            <div className="font-bold text-white text-lg group-hover:text-primary transition-colors leading-tight">{job.title}</div>
                                            <div className="flex items-center gap-3 text-[10px] text-muted font-bold uppercase tracking-wider">
                                                <span className="text-white/40">ID: {job.work_order_number || job.id.slice(0, 8)}</span>
                                                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                                <span>{new Date(job.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <span className={`flex-1 sm:flex-none text-center px-3 py-1 text-[9px] rounded-md font-black uppercase tracking-widest
                                                ${job.priority === 'critical' ? 'bg-danger/20 text-danger border border-danger/30 animate-pulse' :
                                                    job.priority === 'high' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' :
                                                        'bg-slate-800 text-muted border border-white/5'}`}>
                                                {job.priority}
                                            </span>
                                            <span className={`flex-1 sm:flex-none text-center px-3 py-1 text-[9px] rounded-md font-black uppercase tracking-widest
                                                ${job.status === 'completed' ? 'bg-success/20 text-success border border-success/30' :
                                                    job.status === 'in_progress' ? 'bg-secondary/20 text-secondary border border-secondary/30' :
                                                        'bg-slate-800 text-muted'}`}>
                                                {job.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="glass-panel overflow-hidden border-danger/20 shadow-2xl h-fit">
                    <div className="px-8 py-6 border-b border-danger/10 bg-danger/10 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-danger" />
                            <h2 className="text-lg font-black text-danger uppercase tracking-tight">{tenant?.theme_json?.naming?.inventoryLabel || "Inventory"}</h2>
                        </div>
                        <span className="bg-danger text-white text-[10px] font-black px-2 py-1 rounded">CRITICAL</span>
                    </div>
                    <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                        {lowStockItems.length === 0 ? (
                            <div className="p-12 text-center">
                                <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3 opacity-20" />
                                <p className="text-muted text-sm font-medium">Inventory stable.</p>
                            </div>
                        ) : (
                            lowStockItems.map(item => (
                                <div key={item.id} className="px-8 py-4 hover:bg-danger/5 transition-colors flex justify-between items-center">
                                    <div className="space-y-1">
                                        <div className="font-bold text-white uppercase tracking-tight text-sm">{item.name}</div>
                                        <div className="text-[10px] text-muted font-bold tracking-widest">MIN THRESHOLD: {item.min_quantity} {item.unit}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-danger font-black text-lg leading-none">{item.quantity}</div>
                                        <span className="text-[10px] font-bold text-muted uppercase">{item.unit} REMAINING</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                        <Link href="inventory" className="text-xs font-bold text-muted hover:text-white uppercase tracking-widest transition-colors">
                            REPLENISH STOCKS →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

