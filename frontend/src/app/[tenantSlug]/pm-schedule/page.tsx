"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';
import {
    Calendar as CalendarIcon,
    List,
    Plus,
    Settings,
    Trash2,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    X,
    Save,
    MapPin,
    Tag,
    Activity,
    ClipboardList,
    RefreshCw
} from 'lucide-react';

export default function PMSchedulePage() {
    const { tenant } = useTenant();
    const [schedules, setSchedules] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        frequency_type: 'daily',
        frequency_interval: 1,
        asset_id: '',
        next_due: new Date().toISOString().split('T')[0], // Default to today
        is_active: true
    });
    const [assets, setAssets] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchData = async () => {
        if (!tenant) return;
        setLoading(true);
        try {
            const [schedRes, assetRes] = await Promise.allSettled([
                api.get('/pm-schedules/'),
                api.get('/assets/')
            ]);

            if (schedRes.status === 'fulfilled') {
                setSchedules(schedRes.value.data);
            } else {
                console.error("PM Schedules fetch failed", schedRes.reason);
            }

            if (assetRes.status === 'fulfilled') {
                setAssets(assetRes.value.data);
            } else {
                console.error("Assets fetch failed", assetRes.reason);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenant) {
            fetchData();
        }
    }, [tenant]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                frequency_interval: parseInt(String(formData.frequency_interval)),
                asset_id: formData.asset_id || null,
                next_due: formData.next_due ? new Date(formData.next_due).toISOString() : null
            };

            if (editingId) {
                await api.put(`/pm-schedules/${editingId}`, payload);
                setMessage("Sequence recalibrated successfully.");
            } else {
                await api.post('/pm-schedules/', payload);
                setMessage("Maintenance sequence initialized.");
            }
            setTimeout(() => setMessage(""), 5000);
            setIsModalOpen(false);
            setEditingId(null);
            fetchData();
            // Reset form
            setFormData({
                title: '',
                description: '',
                frequency_type: 'daily',
                frequency_interval: 1,
                asset_id: '',
                next_due: new Date().toISOString().split('T')[0],
                is_active: true
            });
        } catch (err: any) {
            console.error(err);
            setMessage(err.response?.data?.detail || "Deployment failed.");
            setTimeout(() => setMessage(""), 5000);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        setFormData({
            title: item.title,
            description: item.description || '',
            frequency_type: item.frequency_type,
            frequency_interval: item.frequency_interval,
            asset_id: item.asset_id || '',
            next_due: item.next_due ? item.next_due.split('T')[0] : '',
            is_active: item.is_active
        });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Confirm schedule termination?")) return;
        try {
            await api.delete(`/pm-schedules/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    // Calendar Helpers
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];
        const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-32 bg-white/2 hover:bg-white/5 transition-colors border-r border-b border-white/5"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const daySchedules = schedules.filter(s => s.next_due && s.next_due.startsWith(dateStr));

            days.push(
                <div key={day} className="h-32 bg-transparent border-r border-b border-white/5 p-3 overflow-y-auto hover:bg-white/5 transition-all group">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-white/40 group-hover:text-primary transition-colors">{day}</span>
                        {daySchedules.length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"></span>
                        )}
                    </div>
                    <div className="space-y-1">
                        {daySchedules.map(sched => (
                            <div
                                key={sched.id}
                                onClick={() => handleSignOffClick(sched)}
                                className={`text-[9px] p-1.5 rounded-md border truncate cursor-pointer transition-all hover:scale-[1.02] active:scale-95 font-black uppercase tracking-widest ${sched.is_active ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white/5 text-muted border-white/10'}`}
                                title={`Click to Sign Off: ${sched.title}`}
                            >
                                {sched.title}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="glass-panel overflow-hidden border-white/5 shadow-2xl animate-in zoom-in-95 duration-500">
                <div className="flex justify-between items-center p-6 bg-white/5 border-b border-white/5">
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">{monthName}</h2>
                    <div className="flex gap-2">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/10 rounded-lg transition-all text-muted hover:text-white border border-transparent hover:border-white/10">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1 text-[10px] font-black text-muted hover:text-white uppercase tracking-widest border border-white/10 rounded-lg hover:bg-white/5 transition-all">
                            Today
                        </button>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/10 rounded-lg transition-all text-muted hover:text-white border border-transparent hover:border-white/10">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-7 border-b border-white/5 bg-white/2 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-center py-3">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div className="grid grid-cols-7 bg-white/[0.01]">
                    {days}
                </div>
            </div>
        );
    };

    const [message, setMessage] = useState("");
    const [signingOff, setSigningOff] = useState(false);
    const [signOffModalOpen, setSignOffModalOpen] = useState(false);
    const [selectedPM, setSelectedPM] = useState<any>(null);
    const [signOffNotes, setSignOffNotes] = useState("");

    const handleSignOffClick = (pm: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        setSelectedPM(pm);
        setSignOffNotes("");
        setSignOffModalOpen(true);
    };

    const handleSignOffSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPM) return;
        setSigningOff(true);
        try {
            await api.post(`/pm-schedules/${selectedPM.id}/sign-off`, { notes: signOffNotes });
            setMessage(`PM "${selectedPM.title}" signed off successfully.`);
            setTimeout(() => setMessage(""), 5000);
            setSignOffModalOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            setMessage("Sign-off failed.");
            setTimeout(() => setMessage(""), 5000);
        } finally {
            setSigningOff(false);
        }
    };

    // Unified error/success messaging handled by setMessage

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{tenant?.theme_json?.naming?.pmLabel || "PM Schedule"}</h1>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-muted font-medium">Preventative maintenance sequences and standalone deployment registry</p>
                        {message && (
                            <div className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full animate-in slide-in-from-left-4">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{message}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white/5 p-1 rounded-xl border border-white/5 flex gap-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-white hover:bg-white/5'}`}
                        >
                            <List className="w-3.5 h-3.5" />
                            Registry
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-white hover:bg-white/5'}`}
                        >
                            <CalendarIcon className="w-3.5 h-3.5" />
                            Timeline
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                title: '',
                                description: '',
                                frequency_type: 'daily',
                                frequency_interval: 1,
                                asset_id: '',
                                next_due: new Date().toISOString().split('T')[0],
                                is_active: true
                            });
                            setIsModalOpen(true);
                        }}
                        className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        INITIALIZE SEQUENCE
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {viewMode === 'list' ? (
                        <div className="glass-panel overflow-hidden border-white/5 shadow-2xl animate-in fade-in duration-500">
                            <div className="p-6 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <ClipboardList className="text-primary w-5 h-5" />
                                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Maintenance Registry</h2>
                                </div>
                                <button onClick={fetchData} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted hover:text-white border border-transparent hover:border-white/5">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/5">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-8 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Sequence Designation</th>
                                            <th className="px-8 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Operational Asset</th>
                                            <th className="px-8 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Recurrence</th>
                                            <th className="px-8 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Next Deployment</th>
                                            <th className="px-8 py-4 text-right text-[10px] font-black text-muted uppercase tracking-[0.2em]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {schedules.map(item => (
                                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg border ${item.is_active ? 'bg-primary/5 border-primary/20' : 'bg-white/5 border-white/5'}`}>
                                                            <Activity className={`w-4 h-4 ${item.is_active ? 'text-primary' : 'text-muted'}`} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-white group-hover:text-primary transition-colors uppercase tracking-tight">{item.title}</div>
                                                            <div className="text-[10px] font-medium text-muted mt-0.5 max-w-xs truncate uppercase tracking-wider">{item.description}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    {item.asset ? (
                                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 text-white border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                            <Tag className="w-3.5 h-3.5 text-primary opacity-50" />
                                                            {item.asset.name}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-muted/30 uppercase tracking-[0.2em]">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
                                                        <Clock className="w-3.5 h-3.5 text-primary opacity-50" />
                                                        {item.frequency_interval} {item.frequency_type}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${item.next_due && new Date(item.next_due) < new Date() ? 'bg-danger/10 text-danger border-danger/20' : 'bg-success/10 text-success border-success/20'}`}>
                                                        {item.next_due ? new Date(item.next_due).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleSignOffClick(item)}
                                                            className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                                                        >
                                                            Sign Off
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="p-2 hover:bg-secondary/10 text-muted hover:text-secondary border border-transparent hover:border-secondary/20 rounded-lg transition-all"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-2 hover:bg-danger/10 text-muted hover:text-danger border border-transparent hover:border-danger/20 rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {schedules.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-20 text-center text-muted font-black uppercase tracking-widest text-[10px]">Registry is currently offline / no active sequences detected.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        renderCalendar()
                    )}
                </>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="glass-panel p-0 w-full max-w-2xl border-white/10 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-3">
                                <Settings className="text-primary w-6 h-6 animate-spin-slow" />
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{editingId ? 'Recalibrate Sequence' : 'Initialize Sequence'}</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-6 h-6 text-muted" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Sequence Designation *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-bold uppercase tracking-wide text-sm"
                                    required
                                    placeholder="e.g., QUADRANT B-7 FILTRATION CHECK"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Recurrence Interval *</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            name="frequency_interval"
                                            value={formData.frequency_interval}
                                            onChange={handleChange}
                                            className="w-20 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary outline-none font-black text-center"
                                            required
                                        />
                                        <select
                                            name="frequency_type"
                                            value={formData.frequency_type}
                                            onChange={handleChange}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary outline-none font-bold uppercase text-xs"
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="fortnightly">Fortnightly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="quarterly">Quarterly</option>
                                            <option value="6 monthly">6 Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Target Asset</label>
                                    <select
                                        name="asset_id"
                                        value={formData.asset_id}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary outline-none font-bold uppercase tracking-widest text-xs appearance-none cursor-pointer"
                                    >
                                        <option value="">-- UNLINKED --</option>
                                        {assets.map(a => (
                                            <option key={a.id} value={a.id}>{a.name} [{a.code}]</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">First Due Date *</label>
                                    <input
                                        type="date"
                                        name="next_due"
                                        value={formData.next_due}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary outline-none font-bold tracking-widest text-xs"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <label className="flex items-center gap-3 cursor-pointer group mt-4">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={handleCheck}
                                                className="peer hidden"
                                            />
                                            <div className="w-10 h-6 bg-white/5 border border-white/10 rounded-full peer-checked:bg-primary/20 peer-checked:border-primary transition-all"></div>
                                            <div className="absolute top-1 left-1 w-4 h-4 bg-white/20 rounded-full peer-checked:left-5 peer-checked:bg-primary transition-all"></div>
                                        </div>
                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest group-hover:text-white transition-colors">Sequence Status: {formData.is_active ? 'Online' : 'Offline'}</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Procedural Directives / Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white/80 focus:ring-1 focus:ring-primary outline-none text-xs h-24 resize-none"
                                    placeholder="Outline the preventative maintenance steps for this sequence..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-white/5 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2 border border-white/10 text-muted rounded-xl hover:bg-white/5 transition-colors uppercase text-[10px] font-black tracking-widest"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`px-8 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-primary/20 transition-all flex items-center gap-2 ${submitting ? 'opacity-50' : ''}`}
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {submitting ? 'SYNCING...' : (editingId ? 'COMMIT CHANGES' : 'DEPLOY SEQUENCE')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {signOffModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
                    <div className="glass-panel p-0 w-full max-w-lg border-white/10 shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="text-primary w-5 h-5 pulse" />
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Technical Sign-Off</h2>
                            </div>
                            <button onClick={() => setSignOffModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-5 h-5 text-muted" />
                            </button>
                        </div>

                        <form onSubmit={handleSignOffSubmit} className="p-8 space-y-6">
                            <div>
                                <h3 className="text-md font-black text-white uppercase tracking-tight mb-2">{selectedPM?.title}</h3>
                                <p className="text-xs text-muted mb-4">{selectedPM?.description}</p>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest">Completion Intelligence / Notes</label>
                                        <textarea
                                            value={signOffNotes}
                                            onChange={(e) => setSignOffNotes(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary outline-none text-sm h-32 resize-none"
                                            placeholder="Enter technical details, observations, or confirmed measurements..."
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-white/5 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setSignOffModalOpen(false)}
                                    className="px-6 py-2 border border-white/10 text-muted rounded-xl hover:bg-white/5 transition-colors uppercase text-[10px] font-black tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={signingOff}
                                    className={`px-8 py-2 bg-success hover:bg-success/80 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-success/20 transition-all flex items-center gap-2 ${signingOff ? 'opacity-50' : ''}`}
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {signingOff ? 'VALIDATING...' : 'CONFIRM SIGN-OFF'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

