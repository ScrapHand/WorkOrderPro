"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import {
    Box,
    Settings,
    Trash2,
    Plus,
    MapPin,
    Tag,
    Cpu,
    Hash,
    HardDrive,
    X,
    Save,
    Info,
    AlertTriangle,
    ChevronRight,
    Thermometer,
    Zap,
    Activity,
    Search,
    Filter,
    ArrowUpDown,
    LayoutGrid,
    List as ListIcon
} from 'lucide-react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';

export default function AssetsPage() {
    const { tenant, user } = useTenant();
    const params = useParams();
    const [assets, setAssets] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        location: '',
        category: '',
        status: 'Healthy',
        manufacturer: '',
        model: '',
        serial_number: '',
        notes: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Filtering & Sorting State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [locationFilter, setLocationFilter] = useState("all");
    const [sortBy, setSortBy] = useState("recent"); // name, status, recent

    // Derived State for Filtering
    const uniqueCategories = Array.from(new Set(assets.map(a => a.category).filter(Boolean)));
    const uniqueLocations = Array.from(new Set(assets.map(a => a.location).filter(Boolean)));

    const filteredAssets = assets.filter(asset => {
        const matchesSearch =
            asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.model?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
        const matchesLocation = locationFilter === 'all' || asset.location === locationFilter;

        return matchesSearch && matchesStatus && matchesCategory && matchesLocation;
    }).sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'status') return a.status.localeCompare(b.status);
        // Default to recent (assuming higher ID or insert order is recent, but actually backend sort is better. 
        // For now, reverse ID roughly proxies recent if monotonic, or just keep default order)
        return 0;
    });

    // Health Metrics
    const totalAssets = assets.length;
    const healthyCount = assets.filter(a => a.status === 'Healthy').length;
    const warningCount = assets.filter(a => a.status === 'Running with issues').length;
    const breakdownCount = assets.filter(a => a.status === 'Breakdown').length;
    const healthPercentage = totalAssets > 0 ? Math.round((healthyCount / totalAssets) * 100) : 0;


    const fetchAssets = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/assets/');
            setAssets(res.data);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("Fetch assets failed:", err);
            setError("Could not synchronize with facility registry. Verify connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        console.log("Submitting Asset FormData:", formData);

        try {
            if (editingId) {
                await api.put(`/assets/${editingId}`, formData);
            } else {
                await api.post('/assets/', formData);
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({
                name: '',
                code: '',
                location: '',
                category: '',
                status: 'Healthy',
                manufacturer: '',
                model: '',
                serial_number: '',
                notes: ''
            });
            fetchAssets();
        } catch (err: any) {
            console.error("Asset save error:", err.response?.data || err.message);
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string' ? detail : "Deployment failed. Access denied or registry conflict.";
            setError(message);
        }
    };

    const handleEdit = (asset: any) => {
        setFormData({
            name: asset.name,
            code: asset.code,
            location: asset.location || '',
            category: asset.category || '',
            status: asset.status || 'Healthy',
            manufacturer: asset.manufacturer || '',
            model: asset.model || '',
            serial_number: asset.serial_number || '',
            notes: asset.notes || '',
        });
        setEditingId(asset.id);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeletingId(id);
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        try {
            await api.delete(`/assets/${deletingId}`);
            setDeletingId(null);
            fetchAssets();
        } catch (err) {
            console.error("Delete failed", err);
            setError("Decommissioning failed. Ensure no active work orders depend on this asset.");
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase leading-none">
                        {tenant?.theme_json?.naming?.assetsLabel || "Facility Assets"}
                    </h1>
                    <p className="text-muted font-medium mt-1 text-sm">Registry of all operational equipment and machinery</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({
                            name: '',
                            code: '',
                            location: '',
                            category: '',
                            status: 'Healthy',
                            manufacturer: '',
                            model: '',
                            serial_number: '',
                            notes: ''
                        });
                        setIsModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 text-xs lg:text-sm"
                >
                    <Plus className="w-5 h-5" />
                    REGISTER {tenant?.theme_json?.naming?.assetsLabel?.slice(0, -1) || "ASSET"}
                </button>
            </div>
            {/* Health Dashboard & Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Health Overview Card */}
                <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity className="w-16 h-16 text-primary" />
                        </div>
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Fleet Health</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white">{healthPercentage}%</span>
                            <span className="text-xs font-bold text-success uppercase">Operational</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 mt-3 rounded-full overflow-hidden">
                            <div className="h-full bg-success transition-all duration-1000" style={{ width: `${healthPercentage}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Total Assets</span>
                        <span className="text-3xl font-black text-white">{totalAssets}</span>
                        <span className="text-[10px] text-muted uppercase">Units Registered</span>
                    </div>

                    <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-[10px] font-black text-danger/70 uppercase tracking-widest">Critical Attention</span>
                        <div className="flex items-center gap-2">
                            <span className="text-3xl font-black text-white">{breakdownCount}</span>
                            <AlertTriangle className="w-5 h-5 text-danger animate-pulse" />
                        </div>
                        <span className="text-[10px] text-danger/70 uppercase">Offline / Breakdown</span>
                    </div>

                    <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-[10px] font-black text-warning/70 uppercase tracking-widest">Warnings</span>
                        <span className="text-3xl font-black text-white">{warningCount}</span>
                        <span className="text-[10px] text-warning/70 uppercase">Requires Inspection</span>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="lg:col-span-4 bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input
                                type="text"
                                placeholder="Search by name, code, model..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-white/20"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-primary"
                            >
                                <option value="all">ALL STATUS</option>
                                <option value="Healthy">HEALTHY</option>
                                <option value="Running with issues">WARNING</option>
                                <option value="Breakdown">BREAKDOWN</option>
                            </select>

                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-primary"
                            >
                                <option value="all">ALL CATEGORIES</option>
                                {uniqueCategories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                            </select>

                            <select
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-primary"
                            >
                                <option value="all">ALL LOCATIONS</option>
                                {uniqueLocations.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                            </select>

                            <div className="h-full w-px bg-white/10 mx-2"></div>

                            <button
                                onClick={() => setSortBy(prev => prev === 'name' ? 'status' : prev === 'status' ? 'name' : 'name')}
                                className="px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                            >
                                <ArrowUpDown className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase hidden sm:inline">Sort: {sortBy}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>


            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredAssets.map(asset => (
                        <div key={asset.id} className="glass-panel p-0 group flex flex-col overflow-hidden border-white/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                            <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Box className="w-4 h-4 text-primary" />
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">{asset.name}</h3>
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-secondary/10 text-secondary rounded-md border border-secondary/20 text-[9px] font-black uppercase tracking-widest">
                                        <Tag className="w-3 h-3" />
                                        {asset.code}
                                    </div>
                                </div>
                                <div className="p-1.5 bg-white/5 rounded-lg border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Cpu className="w-4 h-4 text-muted" />
                                </div>
                            </div>

                            <div className="p-6 space-y-4 flex-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-1.5">
                                            <MapPin className="w-3 h-3 text-primary" /> Location
                                        </span>
                                        <p className="text-xs font-bold text-white uppercase tracking-wider">{asset.location || 'UNSPECIFIED'}</p>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-1.5">
                                            <Activity className="w-3 h-3 text-primary" /> Current Status
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${asset.status === 'Healthy' ? 'bg-success' :
                                                asset.status === 'Breakdown' ? 'bg-danger' : 'bg-warning'
                                                }`}></div>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${asset.status === 'Healthy' ? 'text-success' :
                                                asset.status === 'Breakdown' ? 'text-danger' : 'text-warning'
                                                }`}>{asset.status || 'Healthy'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex justify-between items-center">
                                <Link
                                    href={`/${params.tenantSlug}/assets/${asset.id}`}
                                    className="text-[10px] font-black text-muted hover:text-primary uppercase tracking-[0.2em] flex items-center gap-1 transition-colors"
                                >
                                    Deep Diagnostics <ChevronRight className="w-3 h-3" />
                                </Link>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(asset)}
                                        className="p-2 hover:bg-secondary/10 text-muted hover:text-secondary border border-transparent hover:border-secondary/20 rounded-lg transition-all"
                                        title="Recalibrate"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                    {user?.role !== 'engineer' && (
                                        <button
                                            onClick={() => handleDelete(asset.id)}
                                            className="p-2 hover:bg-danger/10 text-muted hover:text-danger border border-transparent hover:border-danger/20 rounded-lg transition-all"
                                            title="Decommission"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {assets.length === 0 && (
                        <div className="col-span-full py-20 glass-panel border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-4">
                            <Box className="w-16 h-16 text-white/5" />
                            <div>
                                <h3 className="text-xl font-black text-white/40 uppercase">Registry Empty</h3>
                                <p className="text-xs text-muted font-medium mt-1">Initialize the facility registry by registering your first asset unit.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="glass-panel p-0 w-full max-w-2xl border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-3">
                                <Settings className="text-primary w-6 h-6 animate-spin-slow" />
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{editingId ? 'Recalibrate Asset' : 'Register New Asset'}</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-6 h-6 text-muted" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {error && (
                                <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-danger animate-in shake-in duration-300">
                                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                    <p className="text-xs font-bold uppercase tracking-wide">{error}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Operational Designation *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-bold uppercase tracking-wide text-sm"
                                        required
                                        placeholder="e.g., HVAC UNIT 04"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Registry Tag ID *</label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-mono font-bold tracking-widest text-sm"
                                        required
                                        placeholder="REG-000-X"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Deployment Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-bold uppercase tracking-wide text-xs"
                                        placeholder="Sector G-14"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Operational Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-bold uppercase tracking-wide text-xs"
                                    >
                                        <option value="Healthy">Healthy</option>
                                        <option value="Running with issues">Running with issues</option>
                                        <option value="Breakdown">Breakdown</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Asset Category</label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-white/80 focus:ring-1 focus:ring-primary outline-none text-xs"
                                        placeholder="Mechanical, Electrical, etc."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Manufacturer</label>
                                    <input
                                        type="text"
                                        name="manufacturer"
                                        value={formData.manufacturer}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-white/80 focus:ring-1 focus:ring-primary outline-none text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Model Specification</label>
                                    <input
                                        type="text"
                                        name="model"
                                        value={formData.model}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-white/80 focus:ring-1 focus:ring-primary outline-none text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Serial Identification</label>
                                <input
                                    type="text"
                                    name="serial_number"
                                    value={formData.serial_number}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-white/80 focus:ring-1 focus:ring-primary outline-none text-xs font-mono"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Maintenance Directives / Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white/80 focus:ring-1 focus:ring-primary outline-none text-xs h-24 resize-none"
                                    placeholder="Operational history, known issues, or calibration specs..."
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
                                    className="px-8 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {editingId ? 'COMMIT CHANGES' : 'DEPLOY ASSET'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Asset Delete Modal */}
            {deletingId && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="glass-panel p-0 w-full max-w-md border-danger/30 shadow-2xl overflow-hidden">
                        <div className="p-6 bg-danger/10 border-b border-danger/20 flex justify-between items-center">
                            <div className="flex items-center gap-3 text-danger">
                                <Trash2 className="w-6 h-6 animate-pulse" />
                                <h2 className="text-xl font-black uppercase tracking-tight">Confirm Decommission</h2>
                            </div>
                            <button onClick={() => setDeletingId(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-6 h-6 text-muted" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <p className="text-sm font-medium text-white/80 leading-relaxed">
                                Are you sure you want to <span className="text-danger font-black">DECOMMISSION</span> this asset from the registry?
                                <br /> <br />
                                This may affect historical maintenance records tied to this unit ID.
                            </p>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setDeletingId(null)}
                                    className="px-6 py-2 border border-white/10 text-muted rounded-xl hover:bg-white/5 transition-colors uppercase text-[10px] font-black tracking-widest"
                                >
                                    Abort
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-8 py-2 bg-danger hover:bg-danger/90 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-danger/20 transition-all flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Confirm Decommission
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


