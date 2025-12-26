"use client";
import React, { use, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { api, resolveBackendUrl } from '@/lib/api';
import { useTenant } from '@/context/TenantContext';
import {
    ChevronLeft,
    AlertCircle,
    MapPin,
    Tag,
    Settings,
    FileText,
    ShieldCheck,
    Zap,
    Droplets,
    Wind,
    Camera,
    CheckCircle2,
    Info,
    Layout,
    Pencil,
    Save,
    X,
    Plus,
    Trash2,
    Upload,
    Loader2
} from 'lucide-react';

export default function AssetDetailPage({ params }: { params: Promise<{ tenantSlug: string, id: string }> }) {
    const resolvedParams = use(params);
    const { tenant } = useTenant();
    const [asset, setAsset] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Internal state for editing JSON data
    const [editSpecs, setEditSpecs] = useState<any>({
        loto: { electrical: [], hydraulic: [], pneumatic: [] },
        tech_details: []
    });

    const [user, setUser] = useState<any>(null);

    const fetchData = async () => {
        try {
            const [assetRes, userRes] = await Promise.all([
                api.get(`/assets/${resolvedParams.id}`),
                api.get('/users/me')
            ]);

            const data = assetRes.data;
            setAsset(data);
            setUser(userRes.data);

            // Re-initialize edit state if not defined
            const specs = data.technical_specs || {};
            setEditSpecs({
                loto: specs.loto || { electrical: [], hydraulic: [], pneumatic: [] },
                tech_details: specs.tech_details || []
            });

            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!tenant) return;
        fetchData();
    }, [tenant, resolvedParams.id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/assets/${resolvedParams.id}`, {
                ...asset,
                technical_specs: editSpecs
            });
            await fetchData();
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to save asset registry", err);
            alert("Critical Error: Failed to commit registry updates to server.");
        } finally {
            setSaving(false);
        }
    };

    const addLotoPoint = (type: 'electrical' | 'hydraulic' | 'pneumatic') => {
        const newPoint = {
            id: `P-${Math.floor(Math.random() * 1000)}`,
            location: "",
            procedure: "",
            imageUrl: ""
        };
        setEditSpecs({
            ...editSpecs,
            loto: {
                ...editSpecs.loto,
                [type]: [...(editSpecs.loto[type] || []), newPoint]
            }
        });
    };

    const updateLotoPoint = (type: string, index: number, field: string, value: string) => {
        const typeKey = type as keyof typeof editSpecs.loto;
        const newList = [...editSpecs.loto[typeKey]];
        newList[index] = { ...newList[index], [field]: value };
        setEditSpecs({
            ...editSpecs,
            loto: {
                ...editSpecs.loto,
                [typeKey]: newList
            }
        });
    };

    const removeLotoPoint = (type: string, index: number) => {
        const typeKey = type as keyof typeof editSpecs.loto;
        const newList = editSpecs.loto[typeKey].filter((_: any, i: number) => i !== index);
        setEditSpecs({
            ...editSpecs,
            loto: {
                ...editSpecs.loto,
                [typeKey]: newList
            }
        });
    };

    const addTechSpec = () => {
        setEditSpecs({
            ...editSpecs,
            tech_details: [...(editSpecs.tech_details || []), { label: "", value: "" }]
        });
    };

    const updateTechSpec = (index: number, field: 'label' | 'value', value: string) => {
        const newList = [...editSpecs.tech_details];
        newList[index] = { ...newList[index], [field]: value };
        setEditSpecs({ ...editSpecs, tech_details: newList });
    };

    const removeTechSpec = (index: number) => {
        const newList = editSpecs.tech_details.filter((_: any, i: number) => i !== index);
        setEditSpecs({ ...editSpecs, tech_details: newList });
    };

    const canEdit = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'owner';
    const canView = canEdit || user?.role === 'engineer';

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
    );

    if (!canView) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="p-6 bg-danger/10 border border-danger/20 rounded-full">
                <ShieldCheck className="w-16 h-16 text-danger animate-pulse" />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">RESTRICTED ACCESS</h1>
                <p className="text-muted text-sm font-medium">Deep Diagnostics are limited to Engineering & Management personnel.</p>
            </div>
            <Link href={`/${resolvedParams.tenantSlug}/assets`} className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                Return to Registry
            </Link>
        </div>
    );

    if (!asset) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-danger opacity-50" />
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">DATA UNAVAILABLE</h1>
            <Link href={`/${resolvedParams.tenantSlug}/assets`} className="px-6 py-2 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                Return to Registry
            </Link>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="space-y-4">
                <Link href={`/${resolvedParams.tenantSlug}/assets`} className="group flex items-center gap-2 text-[10px] font-black text-muted hover:text-white uppercase tracking-[0.2em] transition-all">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Tech Registry
                </Link>

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-4">
                            <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg ${isEditing ? 'bg-warning/10 text-warning border-warning/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                {isEditing ? <Settings className="w-3.5 h-3.5 animate-spin-slow" /> : <Layout className="w-3.5 h-3.5" />}
                                {isEditing ? 'Management Mode' : 'Technical Profile'}
                            </span>
                            <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                <Tag className="w-4 h-4 text-primary" />
                                {isEditing ? (
                                    <input
                                        className="bg-transparent border-b border-white/10 focus:border-primary outline-none w-24"
                                        value={asset.code}
                                        onChange={(e) => setAsset({ ...asset, code: e.target.value })}
                                    />
                                ) : asset.code}
                            </span>

                            {isEditing ? (
                                <select
                                    value={asset.status || 'Healthy'}
                                    onChange={(e) => setAsset({ ...asset, status: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-[9px] font-black text-white uppercase outline-none focus:border-primary"
                                >
                                    <option value="Healthy">Healthy</option>
                                    <option value="Running with issues">Running with issues</option>
                                    <option value="Breakdown">Breakdown</option>
                                </select>
                            ) : (
                                <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg ${asset.status === 'Healthy' ? 'bg-success/10 text-success border-success/20' :
                                    asset.status === 'Breakdown' ? 'bg-danger/10 text-danger border-danger/20' : 'bg-warning/10 text-warning border-warning/20'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${asset.status === 'Healthy' ? 'bg-success' :
                                        asset.status === 'Breakdown' ? 'bg-danger' : 'bg-warning'
                                        }`}></div>
                                    {asset.status || 'Healthy'}
                                </div>
                            )}
                        </div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={asset.name}
                                onChange={(e) => setAsset({ ...asset, name: e.target.value })}
                                className="text-4xl md:text-6xl font-black text-white bg-white/5 border-b-2 border-primary focus:outline-none tracking-tighter uppercase w-full max-w-2xl"
                            />
                        ) : (
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">{asset.name}</h1>
                        )}
                        <div className="flex items-center gap-4 text-[10px] font-bold text-muted uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> {isEditing ? (
                                <input
                                    className="bg-transparent border-b border-white/10 focus:border-primary outline-none"
                                    value={asset.location || ""}
                                    onChange={(e) => setAsset({ ...asset, location: e.target.value })}
                                />
                            ) : asset.location || "UNSPECIFIED"}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        fetchData(); // Reset
                                    }}
                                    className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 transition-all"
                                >
                                    <X className="w-5 h-5 text-danger" />
                                    Discard
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Commit Changes
                                </button>
                            </>
                        ) : (
                            canEdit && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-8 py-3 bg-white/5 border border-white/10 hover:border-primary/30 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all hover:scale-105"
                                >
                                    <Pencil className="w-5 h-5 text-primary" />
                                    Edit Registry
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Lockout / Tagout Points */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="glass-panel overflow-hidden border-white/5 shadow-2xl">
                        <div className="p-6 bg-white/5 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="text-primary w-6 h-6" />
                                <div>
                                    <h2 className="text-lg font-black text-white uppercase tracking-tighter">Lockout / Tagout (LOTO) Profile</h2>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">Safety isolation points & procedures</p>
                                </div>
                            </div>
                            {isEditing && (
                                <div className="flex gap-2">
                                    <button onClick={() => addLotoPoint('electrical')} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 hover:bg-primary/20 transition-all">
                                        <Plus className="w-3 h-3" /> Add Electrical
                                    </button>
                                    <button onClick={() => addLotoPoint('hydraulic')} className="px-3 py-1 bg-blue-400/10 text-blue-400 border border-blue-400/20 rounded text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 hover:bg-blue-400/20 transition-all">
                                        <Plus className="w-3 h-3" /> Add hydraulic
                                    </button>
                                    <button onClick={() => addLotoPoint('pneumatic')} className="px-3 py-1 bg-warning/10 text-warning border border-warning/20 rounded text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 hover:bg-warning/20 transition-all">
                                        <Plus className="w-3 h-3" /> Add pneumatic
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-8 space-y-10">
                            {/* Energy Isolation Groups */}
                            {[
                                { type: 'electrical', label: 'Electrical Isolations', icon: Zap, color: 'text-primary' },
                                { type: 'hydraulic', label: 'Hydraulic / Fluid Isolations', icon: Droplets, color: 'text-blue-400' },
                                { type: 'pneumatic', label: 'Pneumatic / Air Isolations', icon: Wind, color: 'text-warning' }
                            ].map((group) => (
                                <div key={group.type} className="space-y-6">
                                    <div className={`flex items-center gap-2 ${group.color}`}>
                                        <group.icon className="w-5 h-5" />
                                        <h3 className="text-sm font-black uppercase tracking-widest">{group.label}</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {(editSpecs.loto[group.type] || []).length > 0 ? (
                                            editSpecs.loto[group.type].map((p: any, i: number) => (
                                                <LOTOCard
                                                    key={i}
                                                    point={p}
                                                    isEditing={isEditing}
                                                    onUpdate={(field: string, val: string) => updateLotoPoint(group.type, i, field, val)}
                                                    onRemove={() => removeLotoPoint(group.type, i)}
                                                />
                                            ))
                                        ) : (
                                            !isEditing && <EmptyLOTO type={group.type} />
                                        )}
                                        {isEditing && (editSpecs.loto[group.type] || []).length === 0 && (
                                            <div className="col-span-full py-4 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-muted">
                                                <p className="text-[10px] font-black uppercase tracking-widest">No primary isolation points designated.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Operational Directives */}
                    <div className="glass-panel p-8 border-white/5">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Operational Directives
                        </h3>
                        {isEditing ? (
                            <textarea
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary outline-none transition-all h-32"
                                value={asset.notes || ""}
                                onChange={(e) => setAsset({ ...asset, notes: e.target.value })}
                                placeholder="Enter high-level technical safety protocols and site-specific directives..."
                            />
                        ) : (
                            <p className="text-sm text-white/70 leading-relaxed font-medium">
                                {asset.notes || "No technical directives entered for this unit."}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Column: Tech Specs */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="glass-panel overflow-hidden border-white/5 shadow-xl">
                        <div className="p-5 bg-white/5 border-b border-white/10 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Settings className="text-primary w-5 h-5" />
                                <h2 className="text-sm font-black text-white uppercase tracking-widest">Technical Specs</h2>
                            </div>
                            {isEditing && (
                                <button onClick={addTechSpec} className="p-1.5 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-all">
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 gap-2">
                                {/* Static Base Fields in Edit Mode */}
                                {isEditing ? (
                                    <>
                                        <EditSpecItem label="Manufacturer" value={asset.manufacturer || ""} onChange={(v) => setAsset({ ...asset, manufacturer: v })} />
                                        <EditSpecItem label="Model" value={asset.model || ""} onChange={(v) => setAsset({ ...asset, model: v })} />
                                        <EditSpecItem label="Serial" value={asset.serial_number || ""} onChange={(v) => setAsset({ ...asset, serial_number: v })} />
                                        <EditSpecItem label="Category" value={asset.category || ""} onChange={(v) => setAsset({ ...asset, category: v })} />
                                        <div className="h-px bg-white/10 my-4"></div>
                                        {/* Dynamic Specs */}
                                        {editSpecs.tech_details.map((td: any, i: number) => (
                                            <div key={i} className="flex gap-2 items-center">
                                                <input
                                                    className="w-1/3 bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-muted font-black uppercase outline-none focus:border-primary"
                                                    value={td.label}
                                                    onChange={(e) => updateTechSpec(i, 'label', e.target.value)}
                                                    placeholder="LABLE"
                                                />
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white font-bold outline-none focus:border-primary"
                                                    value={td.value}
                                                    onChange={(e) => updateTechSpec(i, 'value', e.target.value)}
                                                    placeholder="VALUE"
                                                />
                                                <button onClick={() => removeTechSpec(i)} className="text-danger/50 hover:text-danger p-1">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        <SpecItem label="Manufacturer" value={asset.manufacturer} />
                                        <SpecItem label="Model Number" value={asset.model} />
                                        <SpecItem label="Serial ID" value={asset.serial_number} />
                                        <SpecItem label="Category" value={asset.category} />
                                        {editSpecs.tech_details.map((td: any, i: number) => (
                                            <SpecItem key={i} label={td.label} value={td.value} />
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Image Profile Card */}
                    <div className="glass-panel overflow-hidden border-white/5 relative aspect-square group">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent z-10"></div>
                        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                            <Camera className="w-16 h-16 text-white/10 group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="absolute bottom-8 left-8 right-8 z-20 space-y-2">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Master Identity</p>
                            <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{asset.name}</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

const LOTOCard = ({ point, isEditing, onUpdate, onRemove }: any) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/utils/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onUpdate('imageUrl', res.data.url);
        } catch (err) {
            console.error("Upload failed", err);
            alert("Upload failed. Ensure backend service is responsive.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl group hover:border-primary/40 transition-all border-b-4 border-b-primary/20 relative">
            {isEditing && (
                <button
                    onClick={onRemove}
                    className="absolute -top-3 -right-3 p-2 bg-danger/20 text-danger border border-danger/30 rounded-full hover:bg-danger transition-all z-10 opacity-0 group-hover:opacity-100"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}

            <div className="flex justify-between items-start mb-4 gap-4">
                {isEditing ? (
                    <div className="space-y-2 w-full">
                        <input
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-black text-white uppercase tracking-tight focus:border-primary outline-none"
                            value={point.location}
                            onChange={(e) => onUpdate('location', e.target.value)}
                            placeholder="LOCATION / ID"
                        />
                        <input
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[8px] font-black text-muted uppercase tracking-tight outline-none"
                            value={point.id}
                            onChange={(e) => onUpdate('id', e.target.value)}
                            placeholder="POINT REFERENCE ID"
                        />
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        <span className="text-[12px] font-black text-white uppercase tracking-tight line-clamp-1">{point.location || "UNNAMED POINT"}</span>
                        <span className="block text-[8px] font-black text-muted uppercase tracking-[0.2em]">{point.id || "NO ID"}</span>
                    </div>
                )}
            </div>

            <div className="aspect-video bg-black/40 rounded-xl mb-4 flex flex-col items-center justify-center overflow-hidden border border-white/5 relative group/img cursor-pointer"
                onClick={() => isEditing && fileInputRef.current?.click()}>
                {point.imageUrl ? (
                    <>
                        <img src={resolveBackendUrl(point.imageUrl) || ""} alt={point.location} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700" />
                        {isEditing && (
                            <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                <Upload className="w-8 h-8 text-white animate-bounce" />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-white/5 group-hover:text-primary transition-colors">
                        <Camera className="w-8 h-8" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{isEditing ? 'Upload Photo' : 'No Vision'}</span>
                    </div>
                )}
                {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>

            <div className="space-y-2">
                <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">Procedural Routine</p>
                {isEditing ? (
                    <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-[11px] text-white focus:border-primary outline-none transition-all h-20"
                        value={point.procedure}
                        onChange={(e) => onUpdate('procedure', e.target.value)}
                        placeholder="Detail the exact switch position, lock placement, and verification steps..."
                    />
                ) : (
                    <p className="text-[11px] text-white/80 font-bold leading-tight">{point.procedure || "No procedural guidance defined."}</p>
                )}
            </div>
        </div>
    );
};

const EmptyLOTO = ({ type }: { type: string }) => (
    <div className="col-span-full py-12 border-2 border-white/5 border-dashed rounded-3xl flex flex-col items-center justify-center space-y-3 opacity-40">
        <Layout className="w-10 h-10 text-white/10" />
        <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">No primary {type} isolations</p>
    </div>
);

const SpecItem = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-xl transition-colors">
        <span className="text-[9px] font-black text-muted uppercase tracking-widest">{label}</span>
        <span className="text-xs font-bold text-white uppercase text-right ml-4">{value || 'UNSET'}</span>
    </div>
);

const EditSpecItem = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
    <div className="flex flex-col gap-1.5 py-2">
        <label className="text-[9px] font-black text-muted uppercase tracking-widest px-1">{label}</label>
        <input
            className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold focus:border-primary outline-none transition-all"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);
