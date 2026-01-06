import { S3Client, PutObjectCommand, GetObjectCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import 'dotenv/config';

export class S3Service {
    private client: S3Client;
    private bucket: string;

    constructor() {
        const region = process.env.AWS_REGION || "us-east-1";
        this.bucket = process.env.AWS_BUCKET_NAME || "workorderpro-assets";

        const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "mock-key";
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "mock-secret";

        const clientConfig: any = {
            region,
            credentials: { accessKeyId, secretAccessKey },
            forcePathStyle: true // [FIX] Required for local development with localhost/MinIO/Mock
        };

        // [DEV SAFETY] If using mock keys, DO NOT hit real AWS. Default to localhost if no endpoint provided.
        if (accessKeyId === "mock-key" && !process.env.AWS_ENDPOINT) {
            console.warn("[S3] Using 'mock-key' without AWS_ENDPOINT. Defaulting to 'http://localhost:9000'.");
            clientConfig.endpoint = "http://localhost:9000";
        } else if (process.env.AWS_ENDPOINT) {
            clientConfig.endpoint = process.env.AWS_ENDPOINT;
        }

        this.client = new S3Client(clientConfig);
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

        const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "mock-key";
        // [DEV FALLBACK] If using mock keys without endpoint, use local sink
        if (accessKeyId === "mock-key" && !process.env.AWS_ENDPOINT) {
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');
            // Use PUT for upload to local sink
            const url = `${baseUrl}/api/v1/upload/local-sink?key=${encodeURIComponent(key)}&type=${encodeURIComponent(mimeType)}`;
            return { url, key };
        }

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: mimeType
        });

        // Expires in 15 minutes (900 seconds)
        const url = await getSignedUrl(this.client, command, { expiresIn: 900 });

        return { url, key };
    }

    /**
     * Generates a Presigned URL for GET download.
     */
    async generatePresignedGetUrl(key: string): Promise<string> {
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "mock-key";
        if (accessKeyId === "mock-key" && !process.env.AWS_ENDPOINT) {
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');
            return `${baseUrl}/api/v1/upload/local-sink?key=${encodeURIComponent(key)}`;
        }

        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key
        });

        // Expires in 1 hour
        return getSignedUrl(this.client, command, { expiresIn: 3600 });
    }

    /**
     * Ensures the configured bucket exists (useful for MinIO/Local dev).
     */
    async ensureBucketExists(): Promise<void> {
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "mock-key";
        if (accessKeyId === "mock-key" && !process.env.AWS_ENDPOINT) {
            console.log("[S3] Local-sink mode detected. Skipping bucket existence check.");
            return;
        }

        try {
            await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
            console.log(`[S3] Bucket '${this.bucket}' already exists.`);
        } catch (error: any) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                console.log(`[S3] Bucket '${this.bucket}' not found. Creating...`);
                try {
                    await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
                    console.log(`[S3] Bucket '${this.bucket}' created successfully.`);
                } catch (createError: any) {
                    console.error(`[S3] Failed to create bucket '${this.bucket}':`, createError.message);
                }
            } else {
                console.error(`[S3] Error checking bucket '${this.bucket}':`, error.message);
            }
        }
    }
}
