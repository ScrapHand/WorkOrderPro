"use client";

import { useState } from "react";
import { UploadService } from "@/services/upload.service";
import { UploadCloud, Check, X, Loader2 } from "lucide-react";

interface FileUploaderProps {
    entityType: 'assets' | 'work-orders';
    entityId: string;
    onUploadComplete?: (attachment: any) => void;
}

export const FileUploader = ({ entityType, entityId, onUploadComplete }: FileUploaderProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [error, setError] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('IDLE');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setStatus('UPLOADING');
        setError("");

        try {
            // 1. Get Presigned URL
            const { url, key } = await UploadService.getPresignedUrl(entityType, entityId, file);

            // 2. Upload to S3
            await UploadService.uploadToS3(url, file);

            // 3. Confirm
            const attachment = await UploadService.confirmUpload({
                entityType,
                entityId,
                key,
                fileName: file.name,
                mimeType: file.type,
                size: file.size
            });

            setStatus('SUCCESS');
            if (onUploadComplete) onUploadComplete(attachment);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Upload failed");
            setStatus('ERROR');
        }
    };

    return (
        <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 flex flex-col items-center gap-2">
            {status === 'SUCCESS' ? (
                <div className="text-green-600 flex flex-col items-center">
                    <Check className="w-8 h-8" />
                    <span className="text-sm font-medium">Upload Complete</span>
                    <button
                        onClick={() => { setFile(null); setStatus('IDLE'); }}
                        className="text-xs text-blue-500 hover:underline mt-1"
                    >
                        Upload Another
                    </button>
                </div>
            ) : (
                <>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />

                    {file && status !== 'UPLOADING' && (
                        <button
                            onClick={handleUpload}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 flex items-center gap-2 mt-2"
                        >
                            <UploadCloud className="w-4 h-4" /> Upload
                        </button>
                    )}

                    {status === 'UPLOADING' && (
                        <div className="flex items-center gap-2 text-blue-600">
                            <Loader2 className="animate-spin w-4 h-4" />
                            <span className="text-sm">Uploading...</span>
                        </div>
                    )}

                    {status === 'ERROR' && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                            <X className="w-4 h-4" /> {error}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
