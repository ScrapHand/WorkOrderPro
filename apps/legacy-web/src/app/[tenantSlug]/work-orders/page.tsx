"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import {
    Search,
    Filter,
    RefreshCw,
    Plus,
    MoreVertical,
    ChevronRight,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    PauseCircle
} from 'lucide-react';
import WorkOrderStats from '@/components/WorkOrderStats';

interface WorkOrder {
    id: string;
    work_order_number?: string;
    title: string;
    status: string;
    priority: string;
    created_at: string;
}

export default function WorkOrdersPage() {
    const { tenant } = useTenant();
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");

    const fetchData = useCallback(async () => {
        if (!tenant) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);
            if (priorityFilter) params.append('priority', priorityFilter);

            const ordersPromise = api.get(`/work-orders/?${params.toString()}`);
            const statsPromise = api.get('/work-orders/stats');

            const [ordersRes, statsRes] = await Promise.allSettled([ordersPromise, statsPromise]);

            if (ordersRes.status === 'fulfilled') {
                setWorkOrders(ordersRes.value.data);
            } else {
                console.error("Work Orders Fetch Failed:", ordersRes.reason);
            }

            if (statsRes.status === 'fulfilled') {
                setStats(statsRes.value.data);
            } else {
                console.error("Stats Fetch Failed:", statsRes.reason);
            }
        } catch (err: any) {
            console.error("General Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [tenant, search, statusFilter, priorityFilter]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timeout);
    }, [fetchData]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{tenant?.theme_json?.naming?.workOrdersLabel || "Work Orders"}</h1>
                    <p className="text-muted font-medium mt-1">Manage and track facility maintenance tasks</p>
                </div>
                <Link
                    href={`/${tenant?.slug}/work-orders/new`}
                    className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    NEW DEPLOYMENT
                </Link>
            </div>

            {/* Reporting Section */}
            {stats && <WorkOrderStats stats={stats} />}

            {/* List & Filters Section */}
            <div className="glass-panel overflow-hidden border-white/5 shadow-2xl">
                {/* Filter Bar */}
                <div className="p-6 border-b border-white/5 flex flex-col lg:flex-row gap-6 items-center justify-between bg-white/5">
                    <div className="flex items-center gap-4 w-full lg:w-auto flex-1">
                        <div className="relative flex-1 lg:max-w-md group">
                            <Search className="absolute left-4 top-3 h-4 w-4 text-muted group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Scan registries / search orders..."
                                className="pl-11 w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5">
                            <Filter className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Filters</span>
                        </div>
                        <select
                            className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white uppercase tracking-wider focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                        </select>
                        <select
                            className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white uppercase tracking-wider focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                        >
                            <option value="">All Priorities</option>
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                            <option value="critical">Critical Only</option>
                        </select>

                        <button
                            onClick={() => fetchData()}
                            className="p-2.5 hover:bg-white/10 text-muted hover:text-white rounded-xl transition-all active:scale-90"
                            title="Reload Registry"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-primary' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Deployment Title</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Operational Status</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Hazard Level</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Timestamp</th>
                                <th className="px-8 py-4 relative"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {workOrders.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="space-y-2">
                                            <AlertCircle className="w-10 h-10 text-muted mx-auto opacity-20" />
                                            <p className="text-muted font-bold uppercase tracking-widest text-xs">No matching orders found in local registry.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {workOrders.map((wo) => (
                                <tr key={wo.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <div className="text-sm font-black text-white group-hover:text-primary transition-colors uppercase tracking-tight">{wo.title}</div>
                                            <div className="text-[10px] text-muted font-mono mt-1 opacity-50">#{wo.work_order_number || wo.id.slice(0, 8)}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <StatusBadge status={wo.status} />
                                    </td>
                                    <td className="px-8 py-5">
                                        <PriorityBadge priority={wo.priority} />
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-xs font-bold text-muted uppercase tracking-wider">
                                            {new Date(wo.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <Link
                                            href={`/${tenant?.slug}/work-orders/${wo.id}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-primary/20 text-[10px] font-black text-white uppercase tracking-widest rounded-lg border border-white/5 hover:border-primary/30 transition-all border-b-2 active:border-b-0 active:translate-y-0.5"
                                        >
                                            Inspect <ChevronRight className="w-3 h-3 text-primary" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const StatusBadge = ({ status }: { status: string }) => {
    const config = {
        new: { color: "bg-secondary/10 text-secondary border-secondary/30", icon: Clock },
        in_progress: { color: "bg-primary/10 text-primary border-primary/30", icon: ArrowUpRight },
        on_hold: { color: "bg-warning/10 text-warning border-warning/30", icon: PauseCircle },
        completed: { color: "bg-success/10 text-success border-success/30", icon: CheckCircle2 }
    };
    const active = config[status as keyof typeof config] || { color: "bg-slate-800 text-muted border-white/5", icon: AlertCircle };
    const Icon = active.icon;
    const label = status.replace('_', ' ').toUpperCase();

    return (
        <span className={`px-2.5 py-1 inline-flex items-center gap-1.5 text-[9px] font-black rounded-lg border ${active.color} tracking-widest`}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
    const config = {
        low: "text-muted border-white/10",
        medium: "text-secondary border-secondary/20",
        high: "text-orange-500 border-orange-500/20",
        critical: "text-danger border-danger/30 animate-pulse"
    };
    return (
        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${config[priority as keyof typeof config] || 'text-muted'}`}>
            {priority}
        </span>
    );
};

