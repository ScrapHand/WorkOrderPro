"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { useTenant } from '@/context/TenantContext';
import Link from 'next/link';
import {
    Archive,
    Calendar,
    ChevronRight,
    Search,
    History,
    CheckCircle2,
    Clock,
    Filter
} from 'lucide-react';

interface WorkOrder {
    id: string;
    work_order_number?: string;
    title: string;
    status: string;
    priority: string;
    created_at: string;
    completed_at?: string;
}

export default function ArchivesPage() {
    const { tenant } = useTenant();
    const [orders, setOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchArchives = async () => {
        if (!tenant) return;
        setLoading(true);
        try {
            const res = await api.get('/work-orders/?status=completed&limit=1000');
            setOrders(res.data);
        } catch (err) {
            console.error("Failed to fetch archives", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenant) fetchArchives();
    }, [tenant]);

    const filteredOrders = useMemo(() => {
        return orders.filter(o =>
            o.title.toLowerCase().includes(search.toLowerCase()) ||
            o.work_order_number?.toLowerCase().includes(search.toLowerCase())
        );
    }, [orders, search]);

    // Grouping by Month
    const groupedOrders = useMemo(() => {
        const groups: Record<string, WorkOrder[]> = {};

        filteredOrders.forEach(order => {
            const date = order.completed_at ? new Date(order.completed_at) : new Date(order.created_at);
            const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });

            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(order);
        });

        // Sort months descending?
        return Object.entries(groups).sort((a, b) => {
            const dateA = new Date(a[0]);
            const dateB = new Date(b[0]);
            return dateB.getTime() - dateA.getTime();
        });
    }, [filteredOrders]);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                        <Archive className="text-primary w-10 h-10" />
                        Operational Archives
                    </h1>
                    <p className="text-muted font-medium mt-1">Historical breakdown logs separated by deployment cycle</p>
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search historical records..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-muted uppercase tracking-[0.3em] animate-pulse">Syncing Archive Registries...</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {groupedOrders.length === 0 ? (
                        <div className="glass-panel p-20 text-center border-white/5">
                            <History className="w-16 h-16 text-white/5 mx-auto mb-4" />
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter">No Archive Records</h3>
                            <p className="text-muted text-sm mt-1 max-w-sm mx-auto">Either no jobs have been finalized yet, or the registry parameters are being recalibrated.</p>
                        </div>
                    ) : (
                        groupedOrders.map(([month, monthOrders]) => (
                            <div key={month} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-white/5"></div>
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/5 shadow-inner">
                                        <Calendar className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{month}</span>
                                        <span className="text-[9px] font-bold text-muted bg-white/5 px-2 py-0.5 rounded-md ml-2">{monthOrders.length} Records</span>
                                    </div>
                                    <div className="h-px flex-1 bg-white/5"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {monthOrders.map((wo) => (
                                        <Link
                                            key={wo.id}
                                            href={`/${tenant?.slug}/work-orders/${wo.id}`}
                                            className="glass-panel p-6 border-white/5 hover:border-primary/30 group transition-all duration-500 hover:translate-y-[-4px] active:scale-95 shadow-xl hover:shadow-primary/5"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-2 bg-success/10 rounded-lg border border-success/20">
                                                    <CheckCircle2 className="w-5 h-5 text-success" />
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-muted uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                                                    <Clock className="w-3 h-3 text-primary" />
                                                    {new Date(wo.completed_at || wo.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                </div>
                                            </div>

                                            <h3 className="text-base font-black text-white group-hover:text-primary transition-colors uppercase tracking-tight leading-snug">
                                                {wo.title}
                                            </h3>

                                            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                                                <div className="text-[10px] font-mono text-muted/50 group-hover:text-muted transition-colors uppercase">
                                                    #{wo.work_order_number || wo.id.slice(0, 8)}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                                    Inspect Log <ChevronRight className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
