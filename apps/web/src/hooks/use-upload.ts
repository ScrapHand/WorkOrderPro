import { useState } from 'react';
import { api } from '../lib/api';

export interface UploadOptions {
    onSuccess?: (url: string, key: string) => void;
    onError?: (error: any) => void;
    onProgress?: (progress: number) => void;
}

export function useUpload(options: UploadOptions = {}) {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const uploadFile = async (file: File, entityType: string, entityId?: string) => {
        setIsUploading(true);
        setProgress(0);

        try {
            // 1. Get Presigned URL
            const { data: presignedData } = await api.post('/uploads/presign', {
                fileName: file.name,
                fileType: file.type,
                entityType,
                entityId,
            });

            const { uploadUrl, key } = presignedData;

            // 2. Upload to S3 directly
            const xhr = new XMLHttpRequest();

            const uploadPromise = new Promise((resolve, reject) => {
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const pct = Math.round((event.loaded / event.total) * 100);
                        setProgress(pct);
                        options.onProgress?.(pct);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(true);
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                };

                xhr.onerror = () => reject(new Error('Network error during upload'));
                xhr.open('PUT', uploadUrl);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.send(file);
            });

            await uploadPromise;

            // 3. Construct the proxy URL (or final public URL)
            // We use the proxy endpoint to avoid CORS/RLS issues on raw S3
            const finalUrl = `/api/v1/uploads/proxy?key=${encodeURIComponent(key)}`;

            options.onSuccess?.(finalUrl, key);
            return { url: finalUrl, key };
        } catch (error: any) {
            console.error('[useUpload] Error:', error);
            options.onError?.(error);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        uploadFile,
        isUploading,
        progress,
    };
}
