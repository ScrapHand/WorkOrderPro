"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminService } from "@/services/admin.service";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUploader } from "@/components/common/FileUploader";

export default function BrandingPage() {
    const [color, setColor] = useState("#2563eb");
    const [logoUrl, setLogoUrl] = useState("");

    // [FIX] Fetch current values on mount
    const { data: config, isLoading } = useQuery({
        queryKey: ["tenant-config"],
        queryFn: AdminService.getConfig,
    });

    // Sync local state when config is loaded
    useEffect(() => {
        if (config?.branding) {
            if (config.branding.primaryColor) setColor(config.branding.primaryColor);
            if (config.branding.logoUrl) setLogoUrl(config.branding.logoUrl);
        }
    }, [config]);

    const updateBranding = useMutation({
        mutationFn: AdminService.updateBranding,
        onSuccess: () => {
            alert("Branding Updated Successfully");
            window.location.reload();
        },
        onError: () => {
            alert("Failed to update branding");
        }
    });

    const handleSave = () => {
        updateBranding.mutate({
            brandColor: color,
            logoUrl: logoUrl || undefined // Don't send empty string if not set
        });
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Tenant Branding</h2>
                <p className="text-sm text-muted-foreground">
                    Customize the look and feel of your workspace.
                </p>
            </div>

            <div className="grid gap-6 border p-6 rounded-lg bg-white">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Brand Color</label>
                    <div className="flex gap-4 items-center">
                        <Input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <span className="text-sm font-mono text-muted-foreground">{color}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Company Logo</label>
                    <div className="border border-dashed rounded-lg p-4">
                        <FileUploader
                            onUploadComplete={(file) => setLogoUrl(file.url)}
                            entityType="tenant" // New entity type
                            entityId="branding" // Placeholder ID 
                        />
                    </div>
                    {logoUrl && (
                        <div className="mt-4">
                            <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                            <img src={logoUrl} alt="Logo Preview" className="h-12 object-contain" />
                        </div>
                    )}
                </div>

                <div className="pt-4">
                    <Button onClick={handleSave} disabled={updateBranding.isPending}>
                        {updateBranding.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
