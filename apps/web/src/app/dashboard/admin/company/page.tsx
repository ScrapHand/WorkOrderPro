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
import { UploadService } from "@/services/upload.service";

type CompanyFormValues = {
    branding: {
        primaryColor: string;
        secondaryColor: string;
        logoUrl: string;
    };
};

export default function CompanyBuilderPage() {
    const { config, refreshConfig } = useTheme();
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, setValue, watch, reset } = useForm<CompanyFormValues>({
        defaultValues: {
            branding: {
                primaryColor: "#2563eb",
                secondaryColor: "#1e293b",
                logoUrl: "",
            }
        }
    });

    // Sync form with loaded config
    useEffect(() => {
        if (config?.branding) {
            reset({
                branding: {
                    primaryColor: config.branding.primaryColor || "#2563eb",
                    secondaryColor: config.branding.secondaryColor || "#1e293b",
                    logoUrl: config.branding.logoUrl || "",
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

    const handleLogoUpload = async (file: File) => {
        try {
            toast.info("Uploading logo...");
            const entityId = config?.slug || "tenant-logo"; // Fallback, though we usually have slug

            // 1. Get Presigned URL
            const { url, key } = await UploadService.getPresignedUrl("tenant", entityId, file);

            // 2. Upload to S3
            await UploadService.uploadToS3(url, file);

            // 3. Confirm (create attachment record)
            const attachment = await UploadService.confirmUpload({
                entityType: "tenant",
                entityId: entityId, // Actually we might need the real ID, but controller resolves it from token if tenant context
                key,
                fileName: file.name,
                mimeType: file.type,
                size: file.size
            });

            // 4. Update Form with new URL
            setValue("branding.logoUrl", attachment.url); // Assuming attachment returns 'url'
            toast.success("Logo uploaded!");
        } catch (error) {
            console.error(error);
            toast.error("Logo upload failed");
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
                        <CardTitle>Branding</CardTitle>
                        <CardDescription>Customize the look and feel of your workspace.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Primary Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        className="w-12 h-10 p-1"
                                        {...register("branding.primaryColor")}
                                    />
                                    <Input
                                        {...register("branding.primaryColor")}
                                        placeholder="#2563eb"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Secondary Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        className="w-12 h-10 p-1"
                                        {...register("branding.secondaryColor")}
                                    />
                                    <Input
                                        {...register("branding.secondaryColor")}
                                        placeholder="#1e293b"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Company Logo</Label>
                            <div className="flex items-center gap-4">
                                {logoUrl && (
                                    <img src={logoUrl} alt="Logo Preview" className="h-16 w-16 object-contain border rounded" />
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

                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Customize how your team is alerted to new work orders.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Audible Alerts</Label>
                                <p className="text-xs text-muted-foreground">Play a sound when a critical work order is created.</p>
                            </div>
                            <input
                                type="checkbox"
                                className="toggle h-6 w-11 rounded-full bg-muted appearance-none checked:bg-primary transition-colors cursor-pointer"
                                checked={config?.notifications?.enabled ?? true}
                                onChange={(e) => {
                                    api.patch("/tenant/config", {
                                        notifications: { ...config?.notifications, enabled: e.target.checked }
                                    }).then(() => refreshConfig());
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Notification Sound (.mp3)</Label>
                            <div className="flex items-center gap-4">
                                {config?.notifications?.soundUrl && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => new Audio(config.notifications.soundUrl).play()}
                                    >
                                        Test Sound
                                    </Button>
                                )}
                                <div className="flex-1">
                                    <FileUploader
                                        entityType="tenant"
                                        entityId={config?.slug || "notifications"}
                                        onUploadComplete={(att) => {
                                            toast.success("Sound updated!");
                                            api.patch("/tenant/config", {
                                                notifications: { ...config?.notifications, soundUrl: att.url }
                                            }).then(() => refreshConfig());
                                        }}
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">
                                Tip: System will auto-trim uploads longer than 3s to ensure snappy alerts.
                            </p>
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
