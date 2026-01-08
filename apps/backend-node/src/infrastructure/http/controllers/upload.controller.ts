import { Request, Response } from 'express';
import { S3Service } from '../../services/s3.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { PrismaClient } from '@prisma/client';
import { presignSchema } from '../../../application/validators/auth.validator';
import * as fs from 'fs';
import * as path from 'path';

export class UploadController {
    constructor(
        private s3Service: S3Service,
        private prisma: PrismaClient
    ) { }

    presign = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant();
            if (!tenant) return res.status(401).json({ error: 'Tenant context missing' });

            // [VALIDATION] Zod Check
            const result = presignSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ error: 'Invalid request data', details: result.error.issues });
            }

            const { entityType, entityId, fileName, mimeType } = result.data;

            // [SECURITY] Ownership Check
            // Ensure the entity (Asset or WorkOrder) belongs to the requesting tenant
            if (entityType === 'assets') {
                const asset = await this.prisma.asset.findFirst({
                    where: { id: entityId, tenantId: tenant.id }
                });
                if (!asset) return res.status(403).json({ error: 'Access Denied: Asset does not belong to your tenant' });
            } else if (entityType === 'work-orders') {
                const wo = await this.prisma.workOrder.findFirst({
                    where: { id: entityId, tenantId: tenant.id }
                });
                if (!wo) return res.status(403).json({ error: 'Access Denied: Work Order does not belong to your tenant' });
            }

            const { url, key } = await this.s3Service.generatePresignedUrl(
                tenant.id,
                entityType as 'assets' | 'work-orders' | 'tenant',
                entityId,
                fileName,
                mimeType
            );

            res.json({ url, key, mimeType }); // Explicitly return mimeType to client
        } catch (error: any) {
            console.error('Presign Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    // Endpoint to finalize metadata
    createAttachment = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant();
            if (!tenant) return res.status(400).json({ error: 'Tenant context missing' });

            const { entityType, entityId, key, fileName, mimeType, size } = req.body;

            if (!key) {
                return res.status(400).json({ error: 'Missing S3 key' });
            }

            console.log(`[Upload] Creating Attachment:`, { entityType, entityId, fileName }); // [DEBUG]

            // Resolve Tenant ID
            const tenantRecord = await this.prisma.tenant.findUnique({
                where: { slug: tenant.slug }
            });

            if (!tenantRecord) return res.status(404).json({ error: 'Tenant not found' });

            const accessKeyId = process.env.AWS_ACCESS_KEY_ID || 'mock-key';
            let url = '';

            if (accessKeyId === 'mock-key' && !process.env.AWS_ENDPOINT) {
                // Using Local Sink
                const protocol = req.headers['x-forwarded-proto'] || req.protocol;
                const host = req.get('host');
                const baseUrl = (process.env.NEXT_PUBLIC_API_URL || `${protocol}://${host}`).replace(/\/$/, '');
                url = `${baseUrl}/api/v1/upload/proxy?key=${encodeURIComponent(key)}&tenant=${tenant.slug}`;
            } else {
                // Real S3 or MinIO
                const bucket = process.env.AWS_BUCKET_NAME || 'workorderpro-assets';
                const region = process.env.AWS_REGION || 'us-east-1';
                url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

                if (process.env.AWS_ENDPOINT) {
                    // If using MinIO/Endpoint, the URL might need to be different, 
                    // but the Proxy endpoint /api/v1/upload/proxy is safest as it handles signing.
                    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
                    const host = req.get('host');
                    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || `${protocol}://${host}`).replace(/\/$/, '');
                    url = `${baseUrl}/api/v1/upload/proxy?key=${encodeURIComponent(key)}&tenant=${tenant.slug}`;
                }
            }

            const attachment = await this.prisma.attachment.create({
                data: {
                    tenantId: tenantRecord.id,
                    assetId: entityType === 'assets' ? entityId : undefined,
                    workOrderId: entityType === 'work-orders' ? entityId : undefined,
                    fileName,
                    mimeType,
                    size,
                    key,
                    url
                }
            });

            res.status(201).json(attachment);

        } catch (error: any) {
            console.error('Create Attachment Error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // [NEW] Secure Proxy for Private Buckets
    proxy = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant();
            if (!tenant) return res.status(400).json({ error: 'Tenant context missing' });

            const key = req.query.key as string;
            if (!key) return res.status(400).json({ error: 'Missing key' });

            // [FIX] Allow Cross-Origin usage (e.g. <img> tags on different domains)
            // Critical for OpaqueResponseBlocking (ORB) / CORB
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Aggressive caching for images

            // Security Check: Key must belong to tenant
            // Key format: tenants/{tid}/...
            // We'll resolve the tenant ID and check if the key starts with it.
            const tenantRecord = await this.prisma.tenant.findUnique({ where: { slug: tenant.slug } });
            if (!tenantRecord) return res.status(404).json({ error: 'Tenant not found' });

            if (!key.startsWith(`tenants/${tenantRecord.id}/`)) {
                return res.status(403).json({ error: 'Access Denied: File does not belong to this tenant' });
            }

            const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "mock-key";
            if (accessKeyId === "mock-key" && !process.env.AWS_ENDPOINT) {
                // Local Sink Logic: Stream directly for better header control
                const uploadDir = path.join(process.cwd(), 'uploads');
                const filePath = path.join(uploadDir, key);
                if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

                // Infer mime type for local files if possible, or fallback
                // (Optimally we should store mime in DB, but for now fallback is okay for dev)
                if (key.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
                if (key.endsWith('.jpg') || key.endsWith('.jpeg')) res.setHeader('Content-Type', 'image/jpeg');

                return res.sendFile(filePath);
            }

            // Real S3 or MinIO
            const { body, contentType } = await this.s3Service.getObjectStream(key);

            if (contentType) {
                res.setHeader('Content-Type', contentType);
            } else {
                // [FIX] Fallback Content-Type prevents browser from guessing and blocking as ORB
                if (key.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
                else if (key.endsWith('.jpg') || key.endsWith('.jpeg')) res.setHeader('Content-Type', 'image/jpeg');
                else res.setHeader('Content-Type', 'application/octet-stream');
            }

            // Pipe the stream to the response
            if (body && typeof (body as any).pipe === 'function') {
                (body as any).pipe(res);
            } else {
                // SdkStream can sometimes be different depending on platform, 
                // but in Node.js it implements the Readable interface.
                const buffer = await (body as any).transformToByteArray();
                res.end(buffer);
            }

        } catch (error: any) {
            console.error('Proxy Error:', error);
            if (!res.headersSent) res.status(500).send('File Access Error');
        }
    };

    // [DEV ONLY] Local File Sink for Mock Uploads
    localSink = async (req: Request, res: Response) => {
        try {
            const key = req.query.key as string;
            if (!key) return res.status(400).json({ error: 'Missing key' });

            // Security: Prevent path traversal
            if (key.includes('..')) return res.status(400).json({ error: 'Invalid key' });

            const uploadDir = path.join(process.cwd(), 'uploads');
            const filePath = path.join(uploadDir, key);

            // PUT: Upload
            if (req.method === 'PUT') {
                // Ensure directory exists
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                const writeStream = fs.createWriteStream(filePath);
                req.pipe(writeStream);

                writeStream.on('finish', () => {
                    res.status(200).send('Uploaded');
                });
                writeStream.on('error', (err) => {
                    console.error('Local Write Error:', err);
                    res.status(500).send('Write failed');
                });
            }
            // GET: Download
            else if (req.method === 'GET') {
                if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

                // [FIX] Allow Cross-Origin usage for local mock
                res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.sendFile(filePath);
            }
            else {
                res.status(405).send('Method Not Allowed');
            }

        } catch (error: any) {
            console.error('Local Sink Error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}
