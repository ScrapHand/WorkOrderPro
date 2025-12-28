"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
    Package,
    Layers,
    MapPin,
    Tag,
    AlertTriangle,
    Plus,
    Edit3,
    Trash2,
    X,
    Save,
    Info,
    BarChart3,
    ArrowDownWideNarrow,
    ArrowUpWideNarrow,
    RotateCcw
} from 'lucide-react';
import { useTenant } from '@/context/TenantContext';

export default function InventoryPage() {
    const { tenant } = useTenant();
    const [items, setItems] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        quantity: 0,
        unit: 'pcs',
        min_quantity: 0,
        location: '',
        category: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await api.get('/inventory/');
            setItems(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantity' || name === 'min_quantity' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/inventory/${editingId}`, formData);
            } else {
                await api.post('/inventory/', formData);
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({
                name: '',
                sku: '',
                description: '',
                quantity: 0,
                unit: 'pcs',
                min_quantity: 0,
                location: '',
                category: ''
            });
            fetchItems();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (item: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        setFormData({
            name: item.name,
            sku: item.sku || '',
            description: item.description || '',
            quantity: item.quantity,
            unit: item.unit || 'pcs',
            min_quantity: item.min_quantity || 0,
            location: item.location || '',
            category: item.category || ''
        });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Confirm disposal of inventory unit?")) return;
        try {
            await api.delete(`/inventory/${id}`);
            fetchItems();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{tenant?.theme_json?.naming?.inventoryLabel || "Inventory"}</h1>
                    <p className="text-muted font-medium mt-1">Global inventory and material logistics registry</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({
                            name: '',
                            sku: '',
                            description: '',
                            quantity: 0,
                            unit: 'pcs',
                            min_quantity: 0,
                            location: '',
                            category: ''
                        });
                        setIsModalOpen(true);
                    }}
                    className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    ADD {tenant?.theme_json?.naming?.inventoryLabel?.slice(0, -1) || "ITEM"}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="glass-panel overflow-hidden border-white/5 shadow-2xl">
                    <div className="p-6 bg-white/5 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Layers className="text-primary w-5 h-5" />
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Active {tenant?.theme_json?.naming?.inventoryLabel || "Inventory"} Units</h2>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={fetchItems} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted hover:text-white border border-transparent hover:border-white/5">
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Material / SKU</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Operational Stock</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Facility Sector</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Classification</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-black text-muted uppercase tracking-[0.2em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {items.map(item => (
                                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                                    <Package className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-white group-hover:text-primary transition-colors uppercase tracking-tight">{item.name}</div>
                                                    <div className="text-[10px] font-mono text-muted mt-0.5 tracking-widest">{item.sku || 'NO-SKU'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-black ${item.quantity <= item.min_quantity ? 'text-danger' : 'text-success'}`}>
                                                        {item.quantity}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-muted uppercase">{item.unit}</span>
                                                </div>
                                                {item.quantity <= item.min_quantity && (
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-danger/10 text-danger rounded-md border border-danger/20 text-[8px] font-black uppercase tracking-[0.1em] animate-pulse">
                                                        <AlertTriangle className="w-2.5 h-2.5" />
                                                        Critical Depletion
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-wider">
                                                <MapPin className="w-3.5 h-3.5 text-primary opacity-50" />
                                                {item.location || 'GLOBAL'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/5 text-muted rounded-md border border-white/5 text-[9px] font-black uppercase tracking-widest">
                                                <Tag className="w-3 h-3 text-primary/50" />
                                                {item.category || 'GENERAL'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 hover:bg-secondary/10 text-muted hover:text-secondary border border-transparent hover:border-secondary/20 rounded-lg transition-all"
                                                >
                                                    <Edit3 className="w-4 h-4" />
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
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="space-y-2">
                                                <Package className="w-12 h-12 text-white/5 mx-auto" />
                                                <p className="text-muted font-black uppercase tracking-widest text-[10px]">Supply registry offline / no units detected.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="glass-panel p-0 w-full max-w-2xl border-white/10 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="text-primary w-6 h-6" />
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{editingId ? 'Recalibrate Unit' : 'Register Material'}</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-6 h-6 text-muted" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Material Nomenclature *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-bold uppercase tracking-wide text-sm"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">SKU / ID CODE</label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-mono font-bold tracking-widest text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Initial Count *</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-white font-black focus:ring-1 focus:ring-primary outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Unit Type *</label>
                                    <input
                                        type="text"
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-white text-xs uppercase font-bold focus:ring-1 focus:ring-primary outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Alert Threshold *</label>
                                    <input
                                        type="number"
                                        name="min_quantity"
                                        value={formData.min_quantity}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-danger font-black focus:ring-1 focus:ring-danger outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Facility Sector</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-white/80 focus:ring-1 focus:ring-primary outline-none text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Unit Classification</label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-white/80 focus:ring-1 focus:ring-primary outline-none text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Logistical Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white/80 focus:ring-1 focus:ring-primary outline-none text-xs h-24 resize-none"
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
                                    {editingId ? 'COMMIT DEPLOYMENT' : 'INITIALIZE STOCK'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

