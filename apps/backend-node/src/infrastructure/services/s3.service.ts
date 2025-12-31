import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import 'dotenv/config';

export class S3Service {
    private client: S3Client;
    private bucket: string;

    constructor() {
        const region = process.env.AWS_REGION || "us-east-1";
        this.bucket = process.env.AWS_BUCKET_NAME || "workorderpro-assets"; // Fallback to mock bucket name

        this.client = new S3Client({
            region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || "mock-key",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "mock-secret"
            }
        });
    }

    /**
     * Generates a Presigned URL for PUT upload.
     * Enforces strict tenant isolation path.
     */
    async generatePresignedUrl(
        tenantId: string,
        entityType: 'assets' | 'work-orders' | 'tenant',
        entityId: string,
        fileName: string,
        mimeType: string
    ): Promise<{ url: string, key: string }> {
        // [SECURITY] Key Isolation: tenants/{tid}/{type}/{eid}/{uuid}-{name}
        const uniqueId = uuidv4();
        const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_"); // Sanitize
        const key = `tenants/${tenantId}/${entityType}/${entityId}/${uniqueId}-${safeName}`;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: mimeType
        });

        // Expires in 15 minutes (900 seconds)
        const url = await getSignedUrl(this.client, command, { expiresIn: 900 });

        return { url, key };
    }
}
