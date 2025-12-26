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
    Activity
} from 'lucide-react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';

export default function AssetsPage() {
    const { tenant } = useTenant();
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
    const [error, setError] = useState<string | null>(null);

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

    const handleDelete = async (id: string) => {
        if (!confirm("Confirm asset decommissioning?")) return;
        try {
            await api.delete(`/assets/${id}`);
            fetchAssets();
        } catch (err) {
            console.error(err);
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

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {assets.map(asset => (
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
                                    <button
                                        onClick={() => handleDelete(asset.id)}
                                        className="p-2 hover:bg-danger/10 text-muted hover:text-danger border border-transparent hover:border-danger/20 rounded-lg transition-all"
                                        title="Decommission"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
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
        </div>
    );
}


