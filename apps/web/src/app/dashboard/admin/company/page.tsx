"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploader } from "@/components/common/FileUploader";

type CompanyFormValues = {
    branding: {
        primaryColor: string;
        secondaryColor: string;
        textColor: string;
        backgroundColor: string;
        mutedColor: string;
        logoUrl: string;
        appName: string;
        terminology: {
            assets: string;
            workOrders: string;
            technicians: string;
            inventory: string;
            reports: string;
            customers: string;
        };
    };
};

// Curated Themes
const THEMES = [
    {
        name: "Default Blue",
        colors: { p: "#2563eb", s: "#1e293b", t: "#0f172a", b: "#ffffff", m: "#f8fafc" }
    },
    {
        name: "Forest",
        colors: { p: "#166534", s: "#14532d", t: "#022c22", b: "#f0fdf4", m: "#dcfce7" } // Dark green text on pale green bg
    },
    {
        name: "Midnight",
        colors: { p: "#3b82f6", s: "#1e3a8a", t: "#f8fafc", b: "#0f172a", m: "#1e293b" } // White text on dark blue bg
    },
    {
        name: "Royal",
        colors: { p: "#7c3aed", s: "#4c1d95", t: "#2e1065", b: "#faf5ff", m: "#f3e8ff" } // Dark purple text on lavender bg
    },
    {
        name: "Crimson",
        colors: { p: "#dc2626", s: "#7f1d1d", t: "#450a0a", b: "#fff1f2", m: "#ffe4e6" } // Dark red text on pale rose bg
    },
    {
        name: "Slate",
        colors: { p: "#475569", s: "#1e293b", t: "#f8fafc", b: "#020617", m: "#1e293b" } // Dark Mode Slate
    },
];

export default function CompanyBuilderPage() {
    const { config, refreshConfig } = useTheme();
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, setValue, watch, reset } = useForm<CompanyFormValues>({
        defaultValues: {
            branding: {
                primaryColor: "#2563eb",
                secondaryColor: "#1e293b",
                textColor: "#0f172a",
                backgroundColor: "#ffffff",
                mutedColor: "#f1f5f9",
                logoUrl: "",
                appName: "",
                terminology: {
                    assets: "",
                    workOrders: "",
                    technicians: "",
                    inventory: "",
                    reports: "",
                    customers: "",
                }
            }
        }
    });

    // Sync form with loaded config
    useEffect(() => {
        if (config?.branding) {
            const b = config.branding;
            reset({
                branding: {
                    primaryColor: b.primaryColor || "#2563eb",
                    secondaryColor: b.secondaryColor || "#1e293b",
                    textColor: b.textColor || "#0f172a",
                    backgroundColor: b.backgroundColor || "#ffffff",
                    mutedColor: b.mutedColor || "#f1f5f9",
                    logoUrl: b.logoUrl || "",
                    appName: b.appName || "",
                    terminology: {
                        assets: b.terminology?.assets || "",
                        workOrders: b.terminology?.workOrders || "",
                        technicians: b.terminology?.technicians || "",
                        inventory: b.terminology?.inventory || "",
                        reports: b.terminology?.reports || "",
                        customers: b.terminology?.customers || "",
                    }
                }
            });
        }
    }, [config, reset]);

    const logoUrl = watch("branding.logoUrl");

    const onSubmit = async (data: CompanyFormValues) => {
        try {
            setLoading(true);
            await api.patch("/tenant/config", data);
            toast.success("Company settings updated successfully");
            refreshConfig(); // Force theme update
        } catch (error: any) {
            toast.error("Failed to update settings: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Company Builder</h2>
                <p className="text-muted-foreground">Configure your Enterprise Dashboard branding and identity.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Branding & Visuals</CardTitle>
                        <CardDescription>Customize colors, logos, and terminology.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="space-y-2">
                            <Label>Application Name</Label>
                            <Input
                                {...register("branding.appName")}
                                placeholder="e.g. ScrapHand OS"
                            />
                            <p className="text-[0.8rem] text-muted-foreground">Verify in Sidebar header.</p>
                        </div>

                        {/* Presets */}
                        <div className="space-y-2">
                            <Label>Quick Themes</Label>
                            <div className="flex flex-wrap gap-2">
                                {THEMES.map(theme => (
                                    <Button
                                        key={theme.name}
                                        type="button"
                                        variant="outline"
                                        className="h-9 text-xs gap-2 min-w-[120px]"
                                        onClick={() => {
                                            setValue("branding.primaryColor", theme.colors.p);
                                            setValue("branding.secondaryColor", theme.colors.s);
                                            setValue("branding.textColor", theme.colors.t);
                                            setValue("branding.backgroundColor", theme.colors.b);
                                            setValue("branding.mutedColor", theme.colors.m);
                                        }}
                                    >
                                        <div className="flex -space-x-1">
                                            <div className="w-3 h-3 rounded-full ring-1 ring-white" style={{ background: theme.colors.p }} />
                                            <div className="w-3 h-3 rounded-full ring-1 ring-white" style={{ background: theme.colors.s }} />
                                            <div className="w-3 h-3 rounded-full ring-1 ring-white" style={{ background: theme.colors.b }} />
                                        </div>
                                        {theme.name}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Detailed Color Picker */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t pt-4">
                            <ColorInput label="Primary Color" name="branding.primaryColor" register={register} desc="Buttons & Highlights" />
                            <ColorInput label="Secondary Color" name="branding.secondaryColor" register={register} desc="Sidebar & Accents" />
                            <ColorInput label="Text Color" name="branding.textColor" register={register} desc="Main Body Text" />
                            <ColorInput label="Background Color" name="branding.backgroundColor" register={register} desc="Page Background" />
                            <ColorInput label="Muted/Panel Color" name="branding.mutedColor" register={register} desc="Cards & Sidebars" />
                        </div>

                        {/* Terminology */}
                        <div className="pt-4 border-t space-y-4">
                            <div>
                                <h3 className="text-sm font-medium">Domain Terminology</h3>
                                <p className="text-xs text-muted-foreground">Rename entities to match your internal jargon.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputGroup label="Assets" name="branding.terminology.assets" register={register} placeholder="e.g. Machines" />
                                <InputGroup label="Work Orders" name="branding.terminology.workOrders" register={register} placeholder="e.g. Jobs" />
                                <InputGroup label="Technicians" name="branding.terminology.technicians" register={register} placeholder="e.g. Engineers" />
                                <InputGroup label="Inventory" name="branding.terminology.inventory" register={register} placeholder="e.g. Parts" />
                                <InputGroup label="Reports" name="branding.terminology.reports" register={register} placeholder="e.g. Analytics" />
                                <InputGroup label="Customers" name="branding.terminology.customers" register={register} placeholder="e.g. Clients" />
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                            <Label>Company Logo</Label>
                            <div className="flex items-center gap-4">
                                {logoUrl && (
                                    <div className="h-16 w-16 bg-muted rounded border flex items-center justify-center p-2">
                                        <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <FileUploader
                                        entityType="tenant"
                                        entityId={config?.slug || "pending-tenant"}
                                        onUploadComplete={(att) => {
                                            toast.success("Logo uploaded!");
                                            setValue("branding.logoUrl", att.url);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Branding Changes"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

// Sub-components for cleaner code
function ColorInput({ label, name, register, desc }: any) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex gap-2">
                <Input type="color" className="w-12 h-10 p-1 cursor-pointer" {...register(name)} />
                <Input {...register(name)} className="font-mono uppercase" maxLength={7} />
            </div>
            <p className="text-[10px] text-muted-foreground">{desc}</p>
        </div>
    );
}

function InputGroup({ label, name, register, placeholder }: any) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            <Input {...register(name)} placeholder={placeholder} className="h-9" />
        </div>
    );
}
