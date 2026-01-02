"use client";

import { Asset } from "@/types/asset";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Trash, Download } from "lucide-react";
import { useState } from "react";
import { FileUploader } from "@/components/common/FileUploader";
import { api } from "@/lib/api"; // Assuming we have an update endpoint or generic Asset update
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AssetDocsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    asset: Asset;
}

export function AssetDocsModal({ open, onOpenChange, asset }: AssetDocsModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const queryClient = useQueryClient();

    const handleUploadComplete = async (attachment: any) => {
        // Update asset with new document
        // We need a specific endpoint to push to the 'documents' array, or just update the whole asset.
        // For efficiency, let's assume PATCH /assets/:id handles "documents" merge or replacement.

        try {
            const newDoc = {
                name: attachment.fileName,
                url: attachment.url,
                type: attachment.mimeType,
                key: attachment.key // [FIX] Store S3 Key
            };
            const currentDocs = asset.documents || [];
            const updatedDocs = [...currentDocs, newDoc];

            await api.patch(`/assets/${asset.id}`, { documents: updatedDocs });

            toast.success("Document added");
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            setIsUploading(false);
        } catch (error) {
            toast.error("Failed to link document to asset");
        }
    };

    const handleDeleteDoc = async (docUrl: string) => {
        if (!confirm("Remove this document?")) return;
        try {
            const currentDocs = asset.documents || [];
            const updatedDocs = currentDocs.filter(d => d.url !== docUrl);

            await api.patch(`/assets/${asset.id}`, { documents: updatedDocs });

            toast.success("Document removed");
            queryClient.invalidateQueries({ queryKey: ["assets"] });
        } catch (error) {
            toast.error("Failed to remove document");
        }
    };

    const getDocUrl = (doc: any) => {
        if (doc.key) {
            // [FIX] Use Backend Proxy for private buckets with sanitized Base URL
            const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://work-order-pro-backend.onrender.com').replace(/\/api\/v1\/?$/, '');
            return `${apiBase}/api/v1/upload/proxy?key=${doc.key}`;
        }
        return doc.url;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white">
                <DialogHeader>
                    <DialogTitle>Documents: {asset.name}</DialogTitle>
                    <DialogDescription className="text-gray-500">
                        View and manage documents attached to this asset.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* List */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Existing Files</h3>
                        {(!asset.documents || asset.documents.length === 0) && (
                            <p className="text-sm text-gray-400 italic">No documents attached.</p>
                        )}
                        <div className="grid gap-2">
                            {asset.documents?.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-muted/40 rounded border">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-blue-500" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{doc.name}</span>
                                            <span className="text-[10px] text-gray-500">{doc.type}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {/* [NEW] Set Primary Image (Only for images) */}
                                        {doc.type.startsWith('image/') && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Set as Cover Image"
                                                className={asset.imageUrl === getDocUrl(doc) ? "text-yellow-500 hover:bg-yellow-50" : "text-gray-400 hover:text-yellow-500"}
                                                onClick={async () => {
                                                    try {
                                                        await api.patch(`/assets/${asset.id}`, { imageUrl: getDocUrl(doc) });
                                                        toast.success("Cover image updated");
                                                        queryClient.invalidateQueries({ queryKey: ["assets"] });
                                                    } catch (e) {
                                                        toast.error("Failed to set cover image");
                                                    }
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={asset.imageUrl === getDocUrl(doc) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                </svg>
                                            </Button>
                                        )}

                                        <Button variant="ghost" size="icon" asChild>
                                            <a href={getDocUrl(doc)} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-red-50" onClick={() => handleDeleteDoc(doc.url)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upload */}
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Upload New</h3>
                        <FileUploader
                            entityType="assets"
                            entityId={asset.id} // Fix: Must be UUID for DB FK
                            onUploadComplete={handleUploadComplete}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
