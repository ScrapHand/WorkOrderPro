"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { useTenant } from '@/context/TenantContext'; // Fix import path if needed, verified from other files
import {
    LayoutDashboard,
    Activity,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Server
} from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
    const { tenant } = useTenant();
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssets = async () => {
            if (!tenant) return;
            setLoading(true);
            try {
                const res = await api.get('/assets/');
                setAssets(res.data);
            } catch (err) {
                console.error("Failed to fetch assets for report", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssets();
    }, [tenant]);

    const stats = useMemo(() => {
        const s = {
            healthy: 0,
            issues: 0,
            breakdown: 0,
            total: assets.length
        };
        assets.forEach(a => {
            const status = a.status?.toLowerCase() || '';
            if (status === 'healthy') s.healthy++;
            else if (status === 'running with issues') s.issues++;
            else if (status === 'breakdown') s.breakdown++;
        });
        return s;
    }, [assets]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                    <LayoutDashboard className="text-primary w-10 h-10" />
                    Machine Health Intelligence
                </h1>
                <p className="text-muted font-medium mt-1">Real-time infrastructure status and reliability metrics</p>
            </div>

            {/* High Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-panel p-6 border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Server className="w-24 h-24" />
                    </div>
                    <div className="text-sm font-black text-muted uppercase tracking-widest mb-1">Total Assets</div>
                    <div className="text-4xl font-black text-white">{stats.total}</div>
                </div>

                <div className="glass-panel p-6 border-success/20 bg-success/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 className="w-24 h-24 text-success" />
                    </div>
                    <div className="text-sm font-black text-success uppercase tracking-widest mb-1">Operational</div>
                    <div className="text-4xl font-black text-white">{stats.healthy}</div>
                    <div className="text-[10px] font-bold text-success/70 mt-2 uppercase tracking-tight">
                        {stats.total > 0 ? Math.round((stats.healthy / stats.total) * 100) : 0}% Reliability
                    </div>
                </div>

                <div className="glass-panel p-6 border-warning/20 bg-warning/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-24 h-24 text-warning" />
                    </div>
                    <div className="text-sm font-black text-warning uppercase tracking-widest mb-1">Warning State</div>
                    <div className="text-4xl font-black text-white">{stats.issues}</div>
                </div>

                <div className="glass-panel p-6 border-danger/20 bg-danger/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <XCircle className="w-24 h-24 text-danger" />
                    </div>
                    <div className="text-sm font-black text-danger uppercase tracking-widest mb-1">Critical Failures</div>
                    <div className="text-4xl font-black text-white">{stats.breakdown}</div>
                </div>
            </div>

            {/* Asset List Breakdown */}
            <div className="glass-panel overflow-hidden border-white/5 shadow-2xl">
                <div className="p-6 bg-white/5 border-b border-white/5">
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Status Registry</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Asset Identity</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Location</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {assets.map(asset => (
                                <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-white uppercase">{asset.name}</div>
                                        <div className="text-[10px] font-mono text-muted">{asset.code}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-muted uppercase">{asset.location || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${asset.status === 'Healthy' ? 'bg-success/10 text-success border-success/20' :
                                                asset.status === 'Running with issues' ? 'bg-warning/10 text-warning border-warning/20' :
                                                    'bg-danger/10 text-danger border-danger/20'
                                            }`}>
                                            {asset.status === 'Healthy' && <CheckCircle2 className="w-3 h-3" />}
                                            {asset.status === 'Running with issues' && <Activity className="w-3 h-3" />}
                                            {asset.status === 'Breakdown' && <AlertTriangle className="w-3 h-3" />}
                                            {asset.status}
                                        </span>
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
