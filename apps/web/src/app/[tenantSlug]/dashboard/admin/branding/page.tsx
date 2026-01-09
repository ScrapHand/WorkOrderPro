"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminService } from "@/services/admin.service";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUploader } from "@/components/common/FileUploader";

export default function BrandingPage() {
    const [primaryColor, setPrimaryColor] = useState("#2563eb");
    const [secondaryColor, setSecondaryColor] = useState("#475569");
    const [backgroundColor, setBackgroundColor] = useState("#ffffff");
    const [textColor, setTextColor] = useState("#0f172a");
    const [mutedColor, setMutedColor] = useState("#f8fafc");
    const [logoUrl, setLogoUrl] = useState("");

    // [FIX] Fetch current values on mount
    const { data: config, isLoading } = useQuery({
        queryKey: ["tenant-config"],
        queryFn: AdminService.getConfig,
    });

    // Sync local state when config is loaded
    useEffect(() => {
        if (config?.branding) {
            const b = config.branding;
            if (b.primaryColor) setPrimaryColor(b.primaryColor);
            if (b.secondaryColor) setSecondaryColor(b.secondaryColor);
            if (b.backgroundColor) setBackgroundColor(b.backgroundColor);
            if (b.textColor) setTextColor(b.textColor);
            if (b.mutedColor) setMutedColor(b.mutedColor);
            if (b.logoUrl) setLogoUrl(b.logoUrl);
        }
    }, [config]);

    const updateBranding = useMutation({
        mutationFn: AdminService.updateBranding,
        onSuccess: () => {
            toast.success("Branding Updated Successfully");
            // Instead of full reload, we could invalidate queries, but reload ensures CSS variables refresh
            setTimeout(() => window.location.reload(), 1000);
        },
        onError: (error: any) => {
            console.error("Branding Update Error:", error);
            toast.error(error?.response?.data?.error || "Failed to update branding");
        }
    });

    const handleSave = () => {
        updateBranding.mutate({
            primaryColor,
            secondaryColor,
            backgroundColor,
            textColor,
            mutedColor,
            logoUrl: logoUrl || undefined
        });
    };

    if (isLoading) return <div className="p-8">Loading branding profile...</div>;

    const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            <div className="flex gap-4 items-center">
                <Input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer rounded-md"
                />
                <span className="text-xs font-mono text-muted-foreground uppercase">{value}</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 max-w-4xl pb-20">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Appearance & Branding</h2>
                <p className="text-muted-foreground text-sm">
                    Configure your company's visual identity and workspace theme.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visual Identity */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Brand Assets</h3>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Company Logo</label>
                            <div className="border-2 border-dashed rounded-xl p-8 bg-slate-50/50 text-center transition-colors hover:bg-slate-50">
                                <FileUploader
                                    onUploadComplete={(file) => setLogoUrl(file.url)}
                                    entityType="tenant"
                                    entityId="branding"
                                />
                                <p className="text-[10px] text-muted-foreground mt-2">Recommended: PNG or SVG with transparent background</p>
                            </div>
                            {logoUrl && (
                                <div className="mt-4 p-4 bg-slate-100 rounded-lg flex items-center justify-center border">
                                    <img src={logoUrl} alt="Logo Preview" className="h-10 object-contain" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Palette Configuration</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <ColorInput label="Primary Action" value={primaryColor} onChange={setPrimaryColor} />
                            <ColorInput label="Secondary/Border" value={secondaryColor} onChange={setSecondaryColor} />
                            <ColorInput label="Text/Foreground" value={textColor} onChange={setTextColor} />
                            <ColorInput label="Background" value={backgroundColor} onChange={setBackgroundColor} />
                            <ColorInput label="Muted/Sidebar" value={mutedColor} onChange={setMutedColor} />
                        </div>
                    </div>
                </div>

                {/* Live Preview */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Live Preview</h3>
                    <div className="rounded-xl border shadow-xl overflow-hidden h-[400px] flex flex-col scale-90 origin-top"
                        style={{ backgroundColor, color: textColor }}>
                        <div className="h-10 border-b flex items-center px-4 gap-2" style={{ borderColor: `${secondaryColor}40` }}>
                            {logoUrl ? <img src={logoUrl} className="h-4" /> : <div className="h-4 w-4 rounded-full" style={{ backgroundColor: primaryColor }} />}
                            <div className="h-2 w-20 rounded bg-slate-200" />
                        </div>
                        <div className="flex-1 flex">
                            <div className="w-16 border-r p-2 space-y-2" style={{ backgroundColor: mutedColor, borderColor: `${secondaryColor}40` }}>
                                <div className="h-2 w-full rounded" style={{ backgroundColor: primaryColor, opacity: 0.2 }} />
                                <div className="h-2 w-full rounded bg-slate-200" />
                                <div className="h-2 w-full rounded bg-slate-200" />
                            </div>
                            <div className="flex-1 p-4 space-y-4">
                                <div className="h-4 w-1/2 rounded bg-slate-200" />
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="h-20 rounded border bg-white" style={{ borderColor: `${secondaryColor}40` }} />
                                    <div className="h-20 rounded border bg-white" style={{ borderColor: `${secondaryColor}40` }} />
                                </div>
                                <div className="h-8 w-32 rounded flex items-center justify-center text-[10px] font-bold"
                                    style={{ backgroundColor: primaryColor, color: '#fff' }}>
                                    Dynamic Button
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button onClick={handleSave} disabled={updateBranding.isPending} size="lg" className="w-full md:w-auto shadow-lg">
                            {updateBranding.isPending ? "Saving..." : "Save Branding Profile"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
