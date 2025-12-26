"use client";
import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/TenantContext';
import { api, resolveBackendUrl } from '@/lib/api';
import BlockEditor from '@/components/page-builder/BlockEditor';
import UserList from '@/components/admin/UserList';
import {
    Palette,
    Image as ImageIcon,
    Layout,
    Users,
    Save,
    Upload,
    CheckCircle2,
    AlertTriangle,
    Info,
    Edit3
} from 'lucide-react';

const DEFAULT_COLORS = {
    primary: "#f97316",
    secondary: "#3b82f6",
    background: "#0f1115",
    surface: "rgba(30, 41, 59, 0.7)",
    text: "#f8fafc",
    danger: "#ef4444",
    success: "#22c55e",
    warning: "#eab308"
};

const DEFAULT_DASHBOARD_LAYOUT = [
    {
        id: 'hero-1',
        type: 'hero',
        props: {
            title: "Welcome to Work Order Pro",
            subtitle: "Manage your assets, work orders, and maintenance schedule in one place.",
            ctaText: "Create Work Order",
            ctaLink: "work-orders/new"
        }
    }
];

export default function AdminPage() {
    const { tenant, refreshTenant } = useTenant();
    const [activeTab, setActiveTab] = useState<'theme' | 'branding' | 'naming' | 'builder' | 'users'>('theme');
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    // Theme State
    const [colors, setColors] = useState<Record<string, string>>(DEFAULT_COLORS);

    // Branding State
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Builder State
    const [dashboardBlocks, setDashboardBlocks] = useState<any[]>(DEFAULT_DASHBOARD_LAYOUT);

    const [naming, setNaming] = useState<Record<string, string>>({
        tenantName: "ACME Corp",
        systemTitle: "Industrial CMMS",
        dashboardLabel: "Dashboard",
        workOrdersLabel: "Work Orders",
        assetsLabel: "Assets",
        inventoryLabel: "Inventory",
        pmLabel: "PM Schedule"
    });

    useEffect(() => {
        if (tenant?.theme_json?.colors) {
            setColors({ ...DEFAULT_COLORS, ...tenant.theme_json.colors });
        }
        if (tenant?.theme_json?.branding?.logoUrl) {
            setLogoUrl(tenant.theme_json.branding.logoUrl);
        }
        if (tenant?.theme_json?.naming) {
            setNaming((prev: any) => ({ ...prev, ...tenant.theme_json.naming }));
        }
    }, [tenant]);

    // Theme Handlers
    const handleColorChange = (key: string, value: string) => {
        setColors((prev: any) => ({ ...prev, [key]: value }));
        const root = document.documentElement;
        if (key === 'background') root.style.setProperty('--background', value);
        else root.style.setProperty(`--color-${key}`, value);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', e.target.files[0]);

            const res = await api.post('/utils/upload', formData);
            const backendUrl = res.data.url;

            setLogoUrl(backendUrl);

            await api.put('/tenants/theme', {
                colors,
                branding: { logoUrl: backendUrl }
            });

            refreshTenant();
            setMessage("Asset deployed successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (err: any) {
            console.error("Upload failed", err);
            setMessage("Upload failed. Verify server connection.");
        } finally {
            setUploading(false);
        }
    };

    const handleSaveTheme = async () => {
        setSaving(true);
        try {
            // Ensure we only save the relative path to the DB
            // If logoUrl is a full blob/http URL from an old upload, we should try to extract the relative part
            // But since handleLogoUpload already sets res.data.url, it should be /static/...
            await api.put('/tenants/theme', {
                colors,
                branding: { logoUrl: logoUrl || tenant?.theme_json?.branding?.logoUrl },
                naming
            });
            refreshTenant();
            setMessage("System configuration updated.");
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            console.error(err);
            setMessage("Config update failure.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveLayout = async () => {
        try {
            await api.put(`/pages/dashboard`, {
                key: 'dashboard',
                layout_json: { blocks: dashboardBlocks }
            });
            setMessage("Layout operational.");
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            console.error(err);
            setMessage("Layout failed to deploy.");
        }
    };

    const TabButton = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 pb-4 px-6 font-bold uppercase tracking-widest text-[10px] transition-all relative ${activeTab === id ? 'text-primary' : 'text-muted hover:text-white'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
            {activeTab === id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_10px_rgba(249,115,22,0.5)]"></div>
            )}
        </button>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Systems Admin</h1>
                    <p className="text-muted font-medium mt-1">Configure global parameters and tenant aesthetics</p>
                </div>
                {message && (
                    <div className="flex items-center gap-2 bg-success/10 text-success border border-success/20 px-4 py-2 rounded-lg animate-in slide-in-from-right-4">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">{message}</span>
                    </div>
                )}
            </div>

            <div className="flex gap-2 border-b border-white/5 bg-white/5 rounded-t-2xl px-2 pt-2">
                <TabButton id="theme" icon={Palette} label="Primary Theme" />
                <TabButton id="branding" icon={ImageIcon} label="Asset Branding" />
                <TabButton id="naming" icon={Edit3} label="Terminology" />
                <TabButton id="builder" icon={Layout} label="UI Architect" />
                <TabButton id="users" icon={Users} label="Personnel" />
            </div>

            <div className="glass-panel p-10 mt-0 rounded-t-none shadow-2xl">
                {/* THEME TAB */}
                {activeTab === 'theme' && (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div className="flex items-center gap-3">
                            <Palette className="text-primary w-6 h-6" />
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Industrial Palette</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {Object.entries(colors).map(([key, value]) => (
                                <div key={key} className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted">
                                        <span>{key.replace('_', ' ')}</span>
                                        <span className="font-mono text-white/40">{value as string}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-12 h-12 rounded-xl border border-white/10 shadow-inner"
                                            style={{ background: value as string }}
                                        ></div>
                                        <input
                                            type="color"
                                            value={value as string}
                                            onChange={(e) => handleColorChange(key, e.target.value)}
                                            className="h-10 flex-1 bg-transparent border-none cursor-pointer p-0"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 border-t border-white/5 flex justify-end">
                            <button
                                onClick={handleSaveTheme}
                                disabled={saving}
                                className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? "DEPLOYING..." : "SAVE CONFIGURATION"}
                            </button>
                        </div>
                    </div>
                )}

                {/* BRANDING TAB */}
                {activeTab === 'branding' && (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div className="flex items-center gap-3">
                            <ImageIcon className="text-primary w-6 h-6" />
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Identity Assets</h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-muted uppercase tracking-widest">Main Company Logo</label>
                                <div className="h-64 industrial-gradient rounded-3xl border border-white/5 flex items-center justify-center overflow-hidden shadow-inner group relative">
                                    {logoUrl ? (
                                        <img src={resolveBackendUrl(logoUrl) || ""} alt="Logo" className="max-w-[80%] max-h-[80%] object-contain" />
                                    ) : (
                                        <div className="text-center group-hover:scale-110 transition-transform duration-500">
                                            <ImageIcon className="w-12 h-12 text-white/10 mx-auto mb-2" />
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">No Identity Uploaded</span>
                                        </div>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col justify-center space-y-6">
                                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-secondary/10 rounded-lg">
                                            <Info className="text-secondary w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white uppercase">Upload Specifications</h4>
                                            <p className="text-xs text-muted mt-1">Recommended: high-resolution PNG or SVG with transparent background. Industrial systems scale best with vector assets.</p>
                                        </div>
                                    </div>

                                    <div className="relative pt-4">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                            id="logo-upload"
                                        />
                                        <label
                                            htmlFor="logo-upload"
                                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-white transition-all hover:border-primary/50"
                                        >
                                            <Upload className="w-4 h-4 text-primary" />
                                            Select Asset
                                        </label>
                                    </div>
                                </div>

                                <div className="p-6 bg-orange-500/5 rounded-2xl border border-orange-500/10 flex items-center gap-4">
                                    <AlertTriangle className="text-orange-500 w-8 h-8 opacity-50" />
                                    <p className="text-[10px] text-orange-500/80 font-bold uppercase tracking-wider leading-relaxed">
                                        Changes to identity assets propagate immediately across all facility dashboards and client portals. Use caution before deployment.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 flex justify-end">
                            <button onClick={handleSaveTheme} className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
                                PERSIST CHANGES
                            </button>
                        </div>
                    </div>
                )}

                {/* NAMING TAB */}
                {activeTab === 'naming' && (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div className="flex items-center gap-3">
                            <Edit3 className="text-primary w-6 h-6" />
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">System Naming</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Facility Name (Primary Branding)</label>
                                <input
                                    type="text"
                                    value={naming.tenantName}
                                    onChange={(e) => setNaming({ ...naming, tenantName: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                                    placeholder="e.g. ACME Corp"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Global Subtitle</label>
                                <input
                                    type="text"
                                    value={naming.systemTitle}
                                    onChange={(e) => setNaming({ ...naming, systemTitle: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                                    placeholder="e.g. Industrial CMMS"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Dashboard Label</label>
                                <input
                                    type="text"
                                    value={naming.dashboardLabel}
                                    onChange={(e) => setNaming({ ...naming, dashboardLabel: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Work Orders Label</label>
                                <input
                                    type="text"
                                    value={naming.workOrdersLabel}
                                    onChange={(e) => setNaming({ ...naming, workOrdersLabel: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Inventory Label</label>
                                <input
                                    type="text"
                                    value={naming.inventoryLabel}
                                    onChange={(e) => setNaming({ ...naming, inventoryLabel: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Assets Label</label>
                                <input
                                    type="text"
                                    value={naming.assetsLabel}
                                    onChange={(e) => setNaming({ ...naming, assetsLabel: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">PM Schedule Label</label>
                                <input
                                    type="text"
                                    value={naming.pmLabel}
                                    onChange={(e) => setNaming({ ...naming, pmLabel: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 flex justify-end">
                            <button onClick={handleSaveTheme} className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
                                PERSIST TERMINOLOGY
                            </button>
                        </div>
                    </div>
                )}

                {/* BUILDER TAB */}
                {activeTab === 'builder' && (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Layout className="text-primary w-6 h-6" />
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Operations Architect</h2>
                            </div>
                            <button
                                onClick={handleSaveLayout}
                                className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                            >
                                Deploy Layout
                            </button>
                        </div>
                        <div className="p-4 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
                            <BlockEditor blocks={dashboardBlocks} onChange={setDashboardBlocks} />
                        </div>
                    </div>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div className="animate-in fade-in duration-500">
                        <UserList />
                    </div>
                )}
            </div>
        </div>
    );
}

