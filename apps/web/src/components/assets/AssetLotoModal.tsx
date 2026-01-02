"use client";

import { Asset } from "@/types/asset";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

    const handleUploadComplete = async (attachment: any) => {
        try {
            const currentLoto = asset.lotoConfig || {};
            const updatedLoto = { ...currentLoto, [activeTab]: attachment.url };

            await api.patch(`/assets/${asset.id}`, { lotoConfig: updatedLoto });

            toast.success("LOTO Image updated");
            queryClient.invalidateQueries({ queryKey: ["assets"] });
        } catch (error) {
            toast.error("Failed to update LOTO config");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl bg-white h-[80vh] flex flex-col">
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
                    <div className="w-48 bg-gray-50 p-2 rounded-lg space-y-2">
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
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col overflow-y-auto pr-2">
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4 flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-red-800">
                                <strong>WARNING:</strong> Always verify zero energy before performing maintenance. The images below are for reference only.
                            </div>
                        </div>

                        <div className="flex-1 bg-gray-100 rounded-xl border flex items-center justify-center relative overflow-hidden group">
                            {asset.lotoConfig?.[activeTab] ? (
                                <img src={asset.lotoConfig[activeTab]} alt="LOTO Point" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <Lock className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                    <p>No isolation image for {activeTab}</p>
                                </div>
                            )}

                            {/* Overlay Upload Trigger */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <div className="bg-white p-4 rounded-xl shadow-lg w-64">
                                    <p className="text-sm font-medium text-center mb-2">Update Image</p>
                                    <FileUploader
                                        entityType="assets"
                                        entityId={`${asset.id}-loto-${activeTab}`}
                                        onUploadComplete={handleUploadComplete}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
