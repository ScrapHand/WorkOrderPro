"use client";
import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useTenant } from '@/context/TenantContext';
import {
    ChevronLeft,
    Clock,
    AlertCircle,
    CheckCircle2,
    PauseCircle,
    PlayCircle,
    FileText,
    User,
    Calendar,
    PenTool,
    CheckCircle,
    X,
    ClipboardCheck,
    Tag,
    Info,
    History,
    Download,
    Trash2,
    Activity
} from 'lucide-react';
import { generateWorkOrderPDF } from '@/lib/pdf-utils';

interface WorkOrder {
    id: string;
    work_order_number?: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    completion_notes?: string;
    signed_by_name?: string;
    assigned_to?: {
        full_name: string;
        email: string;
    };
    completed_by?: {
        full_name: string;
        email: string;
    };
    active_sessions: Array<{
        id: string;
        user: {
            id: string;
            full_name: string;
            email: string;
        };
        start_time: string;
        end_time?: string;
    }>;
}

export default function WorkOrderDetailPage({ params }: { params: Promise<{ tenantSlug: string, id: string }> }) {
    const resolvedParams = use(params);
    const { tenant, user } = useTenant();
    const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);

    // Completion Modal State
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [completionData, setCompletionData] = useState({
        notes: '',
        signed_by: '',
        completed_at: ''
    });
    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const router = useRouter();

    const fetchOrder = async () => {
        try {
            const res = await api.get(`/work-orders/${resolvedParams.id}`);
            setWorkOrder(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!tenant) return;
        fetchOrder();
    }, [tenant, resolvedParams.id]);

    const updateStatus = async (newStatus: string) => {
        if (newStatus === 'completed') {
            setIsCompleteModalOpen(true);
            return;
        }

        try {
            // Optimistic update
            setWorkOrder(prev => prev ? { ...prev, status: newStatus } : null);
            await api.put(`/work-orders/${resolvedParams.id}`, { status: newStatus });
        } catch (err: any) {
            console.error(err);
            fetchOrder(); // Revert on fail
        }
    };

    const handleCompleteJob = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/work-orders/${resolvedParams.id}`, {
                status: 'completed',
                completion_notes: completionData.notes,
                signed_by_name: completionData.signed_by,
                // Only send if set, otherwise backend defaults to now
                ...(completionData.completed_at ? { completed_at: new Date(completionData.completed_at).toISOString() } : {})
            });
            setIsCompleteModalOpen(false);
            fetchOrder();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/work-orders/${resolvedParams.id}`);
            router.push(`/${resolvedParams.tenantSlug}/work-orders`);
        } catch (err: any) {
            console.error("Delete failed", err);
            alert("Delete failed: " + (err.response?.data?.detail || err.message || "Authorized role required"));
        }
    };

    const handleJoin = async () => {
        setIsJoining(true);
        try {
            const res = await api.post(`/work-orders/${resolvedParams.id}/join`);
            setWorkOrder(res.data);
        } catch (err: any) {
            console.error("Failed to join", err);
            alert("Failed to join active duty: " + (err.response?.data?.detail || "Unknown error"));
        } finally {
            setIsJoining(false);
        }
    };

    const handleLeave = async () => {
        setIsJoining(true);
        try {
            const res = await api.post(`/work-orders/${resolvedParams.id}/leave`);
            setWorkOrder(res.data);
        } catch (err: any) {
            console.error("Failed to leave", err);
            alert("Failed to leave active duty: " + (err.response?.data?.detail || "Unknown error"));
        } finally {
            setIsJoining(false);
        }
    };


    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
    );
    if (!workOrder) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-danger opacity-50" />
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">DATA LINK BROKEN</h1>
            <p className="text-muted">Work order parameters not found in registry.</p>
            <Link href={`/${resolvedParams.tenantSlug}/work-orders`} className="px-6 py-2 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                Return to Registry
            </Link>
        </div>
    );

    const getStatusIcon = (s: string) => {
        switch (s) {
            case 'new': return <Info className="w-4 h-4" />;
            case 'in_progress': return <PlayCircle className="w-4 h-4" />;
            case 'on_hold': return <PauseCircle className="w-4 h-4" />;
            case 'completed': return <CheckCircle2 className="w-4 h-4" />;
            default: return null;
        }
    };

    const getStatusStyles = (s: string) => {
        switch (s) {
            case 'new': return 'bg-info/10 text-info border-info/20';
            case 'in_progress': return 'bg-primary/10 text-primary border-primary/20';
            case 'on_hold': return 'bg-warning/10 text-warning border-warning/20';
            case 'completed': return 'bg-success/10 text-success border-success/20';
            default: return 'bg-white/5 text-muted border-white/5';
        }
    };

    const getPriorityStyles = (p: string) => {
        const priority = p.toLowerCase();
        if (priority === 'high' || priority === 'emergency') return 'text-danger shadow-[0_0_10px_rgba(var(--danger-rgb),0.3)]';
        if (priority === 'medium') return 'text-warning';
        return 'text-success';
    };

    const handleExportPDF = async () => {
        try {
            await generateWorkOrderPDF(workOrder, tenant);
        } catch (err) {
            console.error("Failed to export PDF", err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header & Breadcrumb */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Link href={`/${resolvedParams.tenantSlug}/work-orders`} className="group flex items-center gap-2 text-[10px] font-black text-muted hover:text-white uppercase tracking-[0.2em] transition-all">
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Deployment Deck
                    </Link>

                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-muted hover:text-white hover:bg-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-4">
                            <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${getStatusStyles(workOrder.status)} shadow-lg`}>
                                {getStatusIcon(workOrder.status)}
                                {workOrder.status.replace('_', ' ')}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${getPriorityStyles(workOrder.priority)}`}>
                                <AlertCircle className="w-4 h-4" />
                                PRIORITY: {workOrder.priority}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">{workOrder.title}</h1>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-muted uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-primary" /> ID: {workOrder.work_order_number || workOrder.id}</span>
                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary" /> {new Date(workOrder.created_at).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {workOrder.status === 'new' && (
                            <button
                                onClick={() => updateStatus('in_progress')}
                                className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <PlayCircle className="w-5 h-5" />
                                Initiate Deployment
                            </button>
                        )}

                        {workOrder.status === 'in_progress' && (
                            <div className="flex gap-4">
                                <button
                                    onClick={() => updateStatus('on_hold')}
                                    className="px-6 py-3 bg-white/5 border border-white/10 text-muted hover:text-white hover:bg-white/10 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all"
                                >
                                    <PauseCircle className="w-5 h-5" />
                                    Suspend
                                </button>
                                <button
                                    onClick={() => updateStatus('completed')}
                                    className="px-8 py-3 bg-success hover:bg-success/90 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-lg shadow-success/20 transition-all hover:scale-105 active:scale-95"
                                >
                                    <ClipboardCheck className="w-5 h-5" />
                                    Finalize Job
                                </button>
                            </div>
                        )}

                        {workOrder.status === 'on_hold' && (
                            <button
                                onClick={() => updateStatus('in_progress')}
                                className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <PlayCircle className="w-5 h-5" />
                                Resume Ops
                            </button>
                        )}

                        {tenant && (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'owner') && (

                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="px-6 py-3 bg-danger/10 border border-danger/20 text-danger hover:bg-danger hover:text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
                                Delete Job
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Main Directives */}
                    <div className="glass-panel overflow-hidden border-white/5">
                        <div className="p-6 bg-white/5 border-b border-white/5 flex items-center gap-3">
                            <FileText className="text-primary w-5 h-5" />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Operational Directives</h2>
                        </div>
                        <div className="p-8">
                            <div className="text-white/80 font-medium leading-relaxed whitespace-pre-wrap text-sm lg:text-base">
                                {workOrder.description || "No tactical directives provided for this assignment."}
                            </div>
                        </div>
                    </div>

                    {/* Completion Intelligence */}
                    {workOrder.status === 'completed' && (
                        <div className="glass-panel overflow-hidden border-success/20 bg-success/[0.02] shadow-[0_0_30px_rgba(var(--success-rgb),0.05)]">
                            <div className="p-6 bg-success/10 border-b border-success/20 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-success">
                                    <CheckCircle className="w-6 h-6" />
                                    <h2 className="text-sm font-black uppercase tracking-widest">Post-Deployment Log</h2>
                                </div>
                                <div className="text-[10px] font-black text-success uppercase tracking-widest bg-success/10 px-3 py-1 rounded-full border border-success/20">VERIFIED</div>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="text-success/90 font-bold leading-relaxed whitespace-pre-wrap text-sm italic border-l-2 border-success/30 pl-6">
                                    "{workOrder.completion_notes || "Job finalized without specific intelligence notes."}"
                                </div>
                                <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-4 pt-6 border-t border-success/10">
                                    <div className="text-right">
                                        <div className="text-[9px] font-black text-success/50 uppercase tracking-[0.2em]">Validated By Original Signature</div>
                                        <div className="font-dancing-script text-3xl font-black text-success mt-1 tracking-wider opacity-90 drop-shadow-sm select-none">
                                            {workOrder.signed_by_name || "SYSTEM_USER"}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-success/10 rounded-xl border border-success/20">
                                        <PenTool className="w-6 h-6 text-success opacity-60" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* History Feed Mockup (Future Implementation Placeholder) */}
                    <div className="glass-panel border-white/5 opacity-50 select-none">
                        <div className="p-6 bg-white/5 border-b border-white/5 flex items-center gap-3">
                            <History className="text-muted w-5 h-5" />
                            <h2 className="text-sm font-black text-muted uppercase tracking-widest">Sequence Timeline</h2>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="flex items-center gap-4 text-xs font-bold text-muted/60 uppercase tracking-widest">
                                <div className="w-1 h-1 rounded-full bg-muted/40"></div>
                                Sequence Initialized by System Admin
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold text-muted/60 uppercase tracking-widest">
                                <div className="w-1 h-1 rounded-full bg-primary/40"></div>
                                Metadata Refresh Complete
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Active Team Section */}
                    <div className="glass-panel overflow-hidden border-primary/20 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]">
                        <div className="p-6 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Activity className="text-primary w-5 h-5 animate-pulse" />
                                <h2 className="text-sm font-black text-white uppercase tracking-widest">Live Operations</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{workOrder.active_sessions?.filter(s => !s.end_time).length || 0} Active</span>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            {workOrder.active_sessions?.filter(s => !s.end_time).length === 0 ? (
                                <div className="text-center py-4 text-xs font-medium text-muted uppercase tracking-widest">
                                    No personnel currently engaged
                                </div>
                            ) : (
                                workOrder.active_sessions?.filter(s => !s.end_time).map(session => (
                                    <div key={session.id} className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white uppercase ring-2 ring-primary/20">
                                            {session.user.full_name?.substring(0, 2)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-white uppercase">{session.user.full_name}</span>
                                            <span className="text-[9px] text-primary/80 font-mono">
                                                Since {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Join/Leave Action */}
                            {workOrder.active_sessions?.some(s => s.user.id === user?.id && !s.end_time) ? (
                                <button
                                    onClick={handleLeave}
                                    disabled={isJoining}
                                    className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {isJoining ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <PauseCircle className="w-4 h-4" />
                                    )}
                                    {isJoining ? "Disengaging..." : "Disengage"}
                                </button>
                            ) : (
                                <button
                                    onClick={handleJoin}
                                    disabled={isJoining}
                                    className="w-full py-3 bg-primary hover:bg-primary-hover rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {isJoining ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <PlayCircle className="w-4 h-4" />
                                    )}
                                    {isJoining ? "Mobilizing..." : "Join Active Duty"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Personnel Registry */}
                    <div className="glass-panel overflow-hidden border-white/5">
                        <div className="p-6 bg-white/5 border-b border-white/5 flex items-center gap-3">

                            <User className="text-primary w-5 h-5" />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Registry Data</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest">Tactical Lead</label>
                                <div className="flex items-center gap-3 px-4 py-3 bg-black/40 border border-white/10 rounded-xl">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs uppercase">
                                        {workOrder.assigned_to?.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-white uppercase tracking-tight truncate">
                                            {workOrder.assigned_to?.full_name || "UNASSIGNED"}
                                        </span>
                                        <span className="text-[10px] text-muted truncate">{workOrder.assigned_to?.email || "pending_assignment@hq.com"}</span>
                                    </div>
                                </div>
                            </div>

                            {workOrder.completed_by && (
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-success uppercase tracking-widest">Closing Officer</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-success/5 border border-success/20 rounded-xl">
                                        <div className="w-8 h-8 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-success font-black text-xs uppercase">
                                            {workOrder.completed_by.full_name?.charAt(0) || 'C'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-success uppercase tracking-tight truncate">
                                                {workOrder.completed_by.full_name}
                                            </span>
                                            <span className="text-[10px] text-success/60 truncate">{workOrder.completed_by.email}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-white/5">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-muted">Deployment Origin</span>
                                    <span className="text-white">Manual Trigger</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-muted">Access Protocol</span>
                                    <span className="text-white">L4 Security</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Diagnostics (Placeholder for future metrics) */}
                    <div className="glass-panel p-6 border-white/5 space-y-4">
                        <div className="flex items-center gap-3">
                            <Clock className="text-primary w-5 h-5" />
                            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Efficiency Rating</h2>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-primary w-3/4 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"></div>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-black text-muted uppercase tracking-widest">
                            <span>Predicted: 24h</span>
                            <span className="text-primary">Actual: 18h</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Validation Modal */}
            {isCompleteModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="glass-panel p-0 w-full max-w-2xl border-white/10 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-3 text-success">
                                <PenTool className="w-6 h-6 animate-pulse" />
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Job Termination Authority</h2>
                            </div>
                            <button onClick={() => setIsCompleteModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-6 h-6 text-muted" />
                            </button>
                        </div>

                        <form onSubmit={handleCompleteJob} className="p-8 space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Deployment Intelligence / Completion Notes *</label>
                                <textarea
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white hover:border-white/20 focus:ring-1 focus:ring-success focus:border-success outline-none transition-all font-medium leading-relaxed min-h-[160px] text-sm"
                                    placeholder="Describe architectural changes, component replacements, or troubleshooting intelligence gathered during the deployment sequence..."
                                    required
                                    value={completionData.notes}
                                    onChange={e => setCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Time Completed (Optional)</label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-success focus:border-success outline-none transition-all text-sm"
                                    value={completionData.completed_at}
                                    onChange={e => setCompletionData(prev => ({ ...prev, completed_at: e.target.value }))}
                                />
                                <p className="text-[9px] text-muted font-medium">Leave blank to use current time.</p>
                            </div>

                            <div className="p-6 bg-warning/5 border border-warning/10 rounded-2xl space-y-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-warning" />
                                    <label className="text-[10px] font-black text-warning uppercase tracking-[0.2em]">Validated Electronic Signature *</label>
                                </div>
                                <input
                                    type="text"
                                    className="w-full bg-transparent border-b-2 border-white/10 py-2 text-white focus:border-success outline-none font-dancing-script text-3xl tracking-wide placeholder:font-sans placeholder:text-xs placeholder:italic placeholder:text-muted/30"
                                    placeholder="Execute your authorized digital identifier (Full Name)"
                                    required
                                    value={completionData.signed_by}
                                    onChange={e => setCompletionData(prev => ({ ...prev, signed_by: e.target.value }))}
                                />
                                <p className="text-[9px] font-bold text-muted/60 uppercase tracking-widest leading-relaxed">
                                    Acknowledge: By executing this identifier, you certify that all operational parameters have been restored to nominal specifications and safety protocols were strictly adhered to.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setIsCompleteModalOpen(false)}
                                    className="px-6 py-2 border border-white/10 text-muted rounded-xl hover:bg-white/5 transition-colors uppercase text-[10px] font-black tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-10 py-2 bg-success hover:bg-success/90 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-success/20 transition-all flex items-center gap-3"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Commit & Decommission
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="glass-panel p-0 w-full max-w-md border-danger/30 shadow-2xl overflow-hidden">
                        <div className="p-6 bg-danger/10 border-b border-danger/20 flex justify-between items-center">
                            <div className="flex items-center gap-3 text-danger">
                                <Trash2 className="w-6 h-6 animate-pulse" />
                                <h2 className="text-xl font-black uppercase tracking-tight">Confirm Deletion</h2>
                            </div>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-6 h-6 text-muted" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <p className="text-sm font-medium text-white/80 leading-relaxed">
                                Are you sure you want to <span className="text-danger font-black">PERMANENTLY DELETE</span> this work order?
                                <br /><br />
                                This action creates a permanent gap in the registry and cannot be reversed.
                            </p>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-6 py-2 border border-white/10 text-muted rounded-xl hover:bg-white/5 transition-colors uppercase text-[10px] font-black tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-8 py-2 bg-danger hover:bg-danger/90 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-danger/20 transition-all flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Execute Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}

