import { api } from "@/lib/api";

export const UploadService = {
    /**
     * Get Presigned URL
     */
    getPresignedUrl: async (entityType: 'assets' | 'work-orders' | 'tenant', entityId: string, file: File) => {
        const res = await api.post("/upload/presign", {
            entityType,
            entityId,
            fileName: file.name,
            mimeType: file.type
        });
        return res.data; // { url, key }
    },

    /**
     * Upload File to S3 (Direct PUT)
     */
    uploadToS3: async (presignedUrl: string, file: File) => {
        // Use native fetch to avoid axios header overheads that might conflict with S3 signature
        const res = await fetch(presignedUrl, {
            method: "PUT",
            body: file,
            headers: {
                "Content-Type": file.type
            }
        });

        if (!res.ok) {
            throw new Error(`S3 Upload Failed: ${res.statusText}`);
        }
    },

    /**
     * Confirm Upload (Create Attachment Record)
     */
    confirmUpload: async (data: any) => {
        const res = await api.post("/upload/confirm", data);
        return res.data;
    }
};
