'use client';

import React, { useRef, useState } from 'react';
import { useUpload } from '@/hooks/use-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileIcon, Loader2 } from 'lucide-react';

interface FileUploaderProps {
    entityType: 'work_order' | 'asset' | 'part';
    entityId?: string;
    onUploadSuccess?: (url: string, key: string) => void;
    maxSizeMB?: number;
    allowedTypes?: string[];
}

export function FileUploader({
    entityType,
    entityId,
    onUploadSuccess,
    maxSizeMB = 10,
    allowedTypes = ['image/*', 'application/pdf'],
}: FileUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploadFile, isUploading, progress } = useUpload();
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);

        // Basic Validation
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
            return;
        }

        try {
            const result = await uploadFile(file, entityType, entityId);
            onUploadSuccess?.(result.url, result.key);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            setError(err.message || 'Failed to upload file');
        }
    };

    return (
        <div className="space-y-4 w-full">
            <div
                className={`border-2 border-dashed rounded-lg p-6 transition-colors flex flex-col items-center justify-center gap-2 ${isUploading ? 'bg-muted/50 border-muted' : 'bg-background hover:border-primary/50'
                    }`}
            >
                <Input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={allowedTypes.join(',')}
                    disabled={isUploading}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-sm font-medium">Uploading... {progress}%</span>
                        <Progress value={progress} className="h-1" />
                    </div>
                ) : (
                    <>
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                            <Button
                                variant="link"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-0 font-semibold"
                            >
                                Click to upload
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1">
                                {allowedTypes.join(', ').replace('/*', '')} up to {maxSizeMB}MB
                            </p>
                        </div>
                    </>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
                    <X className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
