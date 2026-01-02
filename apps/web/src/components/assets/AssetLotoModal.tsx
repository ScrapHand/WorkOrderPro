"use client";

import { Asset } from "@/types/asset";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, AlertTriangle, Zap, Droplets, Wind } from "lucide-react";
import { useState } from "react";
import { FileUploader } from "@/components/common/FileUploader";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AssetLotoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    asset: Asset;
}

export function AssetLotoModal({ open, onOpenChange, asset }: AssetLotoModalProps) {
    const [activeTab, setActiveTab] = useState<"electrical" | "pneumatic" | "hydraulic">("electrical");
    const queryClient = useQueryClient();

    // Helper to normalize data (legacy string -> array)
    const getImages = (type: string): string[] => {
        const config = asset.lotoConfig as any || {};
        const val = config[type];
        if (!val) return [];
        if (Array.isArray(val)) return val;
        return [val]; // Legacy single image
    };

    const currentImages = getImages(activeTab);

    const handleUploadComplete = async (attachment: any) => {
        try {
            const currentLoto = asset.lotoConfig as any || {};
            const existing = getImages(activeTab);

            // Append new image
            const updatedImages = [...existing, attachment.url];

            const updatedLoto = { ...currentLoto, [activeTab]: updatedImages };

            await api.patch(`/assets/${asset.id}`, { lotoConfig: updatedLoto });

            toast.success("LOTO Image added");
            queryClient.invalidateQueries({ queryKey: ["assets"] });
        } catch (error) {
            toast.error("Failed to update LOTO config");
        }
    };

    const handleDeleteImage = async (urlToDelete: string) => {
        try {
            const currentLoto = asset.lotoConfig as any || {};
            const existing = getImages(activeTab);
            const updatedImages = existing.filter(url => url !== urlToDelete);

            const updatedLoto = { ...currentLoto, [activeTab]: updatedImages };

            await api.patch(`/assets/${asset.id}`, { lotoConfig: updatedLoto });

            toast.success("Image removed");
            queryClient.invalidateQueries({ queryKey: ["assets"] });
        } catch (error) {
            toast.error("Failed to delete image");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl bg-white h-[80vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Lock className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-red-700">LOTO Procedures</DialogTitle>
                            <p className="text-sm text-muted-foreground">Isolation points for {asset.name}</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-48 bg-gray-50 p-2 rounded-lg space-y-2 shrink-0">
                        <button
                            onClick={() => setActiveTab('electrical')}
                            className={`w-full flex items-center gap-2 p-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'electrical' ? 'bg-white shadow text-yellow-700 border-l-4 border-yellow-500' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Zap className="h-4 w-4" /> Electrical
                        </button>
                        <button
                            onClick={() => setActiveTab('pneumatic')}
                            className={`w-full flex items-center gap-2 p-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'pneumatic' ? 'bg-white shadow text-blue-700 border-l-4 border-blue-500' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Wind className="h-4 w-4" /> Pneumatic
                        </button>
                        <button
                            onClick={() => setActiveTab('hydraulic')}
                            className={`w-full flex items-center gap-2 p-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'hydraulic' ? 'bg-white shadow text-purple-700 border-l-4 border-purple-500' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Droplets className="h-4 w-4" /> Hydraulic
                        </button>

                        <div className="pt-4 mt-auto">
                            <div className="bg-red-50 p-3 rounded text-xs text-red-800 border border-red-100">
                                <strong>Safety First:</strong> Ensure all energy sources are isolated before work.
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col overflow-y-auto pr-2">
                        <div className="flex-1 p-4 bg-gray-50 rounded-xl border min-h-0 overflow-y-auto">
                            {currentImages.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {currentImages.map((url, idx) => (
                                        <div key={idx} className="relative group aspect-video bg-gray-200 rounded-lg overflow-hidden border">
                                            <img
                                                src={getImageUrl(url)}
                                                alt={`LOTO ${activeTab} ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="bg-white/90 hover:bg-white text-black border-none"
                                                    onClick={() => window.open(getImageUrl(url), '_blank')}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteImage(url)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Add Button as last grid item */}
                                    <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 hover:bg-gray-100 transition-colors">
                                        <p className="text-sm font-medium text-gray-500 mb-2">Add Another Image</p>
                                        <FileUploader
                                            entityType="assets"
                                            entityId={asset.id} // Fix: Must be UUID for DB FK
                                            onUploadComplete={handleUploadComplete}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                                    <Lock className="h-16 w-16 mb-4 opacity-20" />
                                    <p className="text-lg font-medium text-gray-600">No images for {activeTab} isolation</p>
                                    <p className="text-sm max-w-sm mx-auto mt-2 mb-6">Upload photos of the isolation points, switches, or valves required for this procedure.</p>

                                    <div className="w-64">
                                        <FileUploader
                                            entityType="assets"
                                            entityId={asset.id} // Fix: Must be UUID for DB FK
                                            onUploadComplete={handleUploadComplete}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
}
