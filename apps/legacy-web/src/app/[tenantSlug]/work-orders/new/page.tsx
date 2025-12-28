"use client";
import React, { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useTenant } from '@/context/TenantContext';

export default function NewWorkOrderPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { tenant } = useTenant();

    const [loading, setLoading] = useState(false);
    const [assets, setAssets] = useState([]);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "low",
        status: "new",
        asset_id: ""
    });

    React.useEffect(() => {
        const fetchAssets = async () => {
            try {
                const res = await api.get('/assets/');
                setAssets(res.data);
            } catch (err) {
                console.error("Failed to fetch assets", err);
            }
        };
        fetchAssets();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) return;

        const payload = {
            ...formData,
            asset_id: formData.asset_id === "" ? null : formData.asset_id
        };

        setLoading(true);
        try {
            await api.post('/work-orders/', payload);
            router.push(`/${resolvedParams.tenantSlug}/work-orders`);
        } catch (err: any) {
            console.error("Submission Error:", err);
            alert("Failed to create work order: " + (err.response?.data?.detail || err.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h1 className="text-2xl lg:text-3xl font-bold">Create {tenant?.theme_json?.naming?.workOrdersLabel?.slice(0, -1) || "Work Order"}</h1>
                <Link
                    href={`/${resolvedParams.tenantSlug}/work-orders`}
                    className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                    <span>←</span> Back to List
                </Link>
            </div>

            <div className="bg-surface p-6 lg:p-8 rounded-lg border shadow-sm animate-in fade-in duration-300">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 font-bold uppercase tracking-widest text-[10px]">Title *</label>
                        <input
                            type="text"
                            required
                            minLength={3}
                            placeholder="e.g. Pump failure on Line 4"
                            className="w-full px-4 py-3 border rounded-md text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none invalid:border-red-500 invalid:text-red-600 bg-black/5"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Minimum 3 characters</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 font-bold uppercase tracking-widest text-[10px]">Description</label>
                        <textarea
                            rows={4}
                            required
                            minLength={10}
                            placeholder="Describe the issue in detail..."
                            className="w-full px-4 py-3 border rounded-md text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none resize-y invalid:border-red-500 bg-black/5"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Minimum 10 characters details helps the engineer.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                        {/* Asset Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 font-bold uppercase tracking-widest text-[10px]">Asset (Optional)</label>
                            <select
                                className="w-full px-4 py-3 border rounded-md text-sm bg-white focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
                                value={formData.asset_id}
                                onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                            >
                                <option value="">-- No Asset --</option>
                                {assets.map((asset: any) => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.name} ({asset.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 font-bold uppercase tracking-widest text-[10px]">Priority</label>
                            <select
                                className="w-full px-4 py-3 border rounded-md text-sm bg-white focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 font-bold uppercase tracking-widest text-[10px]">Initial Status</label>
                            <select
                                className="w-full px-4 py-3 border rounded-md text-sm bg-white focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="new">New</option>
                                <option value="in_progress">In Progress</option>
                                <option value="on_hold">On Hold</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto bg-[var(--color-primary)] text-white px-8 py-3 rounded-md hover:opacity-90 transition shadow-sm disabled:opacity-50 font-bold uppercase text-[10px] tracking-widest"
                        >
                            {loading ? "Creating..." : `Create ${tenant?.theme_json?.naming?.workOrdersLabel?.slice(0, -1) || "Work Order"}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
