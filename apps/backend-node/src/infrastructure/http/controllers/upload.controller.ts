import { Request, Response } from 'express';
import { S3Service } from '../../services/s3.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { PrismaClient } from '@prisma/client';
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
            if (!tenant) return res.status(400).json({ error: 'Tenant context missing' });

            const { entityType, entityId, fileName, mimeType } = req.body;

            if (!['assets', 'work-orders', 'tenant'].includes(entityType)) {
                return res.status(400).json({ error: 'Invalid entity type' });
            }

            // [FIX] Resolve Tenant ID for S3 Key and FK
            const tenantRecord = await this.prisma.tenant.findUnique({
                where: { slug: tenant.slug }
            });

            if (!tenantRecord) return res.status(404).json({ error: 'Tenant not found' });

            const { url, key } = await this.s3Service.generatePresignedUrl(
                tenantRecord.id, // Real UUID
                entityType as 'assets' | 'work-orders' | 'tenant',
                entityId,
                fileName,
                mimeType
            );

            res.json({ url, key });
        } catch (error: any) {
            console.error('Presign Error:', error);
            res.status(500).json({ error: error.message });
        }
    };

    // Endpoint to finalize metadata
    createAttachment = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant();
            if (!tenant) return res.status(400).json({ error: 'Tenant context missing' });

            const { entityType, entityId, key, fileName, mimeType, size } = req.body;

            console.log(`[Upload] Creating Attachment:`, { entityType, entityId, fileName }); // [DEBUG]

            // Resolve Tenant ID
            const tenantRecord = await this.prisma.tenant.findUnique({
                where: { slug: tenant.slug }
            });

            if (!tenantRecord) return res.status(404).json({ error: 'Tenant not found' });

            const bucket = process.env.AWS_BUCKET_NAME || 'workorderpro-assets';
            const region = process.env.AWS_REGION || 'us-east-1';
            const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

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
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            res.setHeader('Access-Control-Allow-Origin', '*');
            // Note: global CORS might override ACAO, but CORP is critical for CORB.

            // Security Check: Key must belong to tenant
            // Key format: tenants/{tid}/...
            // We'll resolve the tenant ID and check if the key starts with it.
            const tenantRecord = await this.prisma.tenant.findUnique({ where: { slug: tenant.slug } });
            if (!tenantRecord) return res.status(404).json({ error: 'Tenant not found' });

            if (!key.startsWith(`tenants/${tenantRecord.id}/`)) {
                return res.status(403).json({ error: 'Access Denied: File does not belong to this tenant' });
            }

            const signedUrl = await this.s3Service.generatePresignedGetUrl(key);
            res.redirect(signedUrl);

        } catch (error: any) {
            console.error('Proxy Error:', error);
            res.status(500).send('File Access Error');
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
