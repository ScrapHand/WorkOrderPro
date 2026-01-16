import { Request, Response } from 'express';
import { S3Service } from '../../services/s3.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { PrismaClient } from '@prisma/client';
import { presignSchema } from '../../../application/validators/auth.validator';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../logging/logger';

export class UploadController {
    constructor(
        private s3Service: S3Service,
        private prisma: PrismaClient
    ) { }

    presign = async (req: Request, res: Response) => {
        const tenant = getCurrentTenant();
        try {
            if (!tenant) return res.status(401).json({ error: 'Tenant context missing' });

            // [VALIDATION] Zod Check
            const result = presignSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ error: 'Invalid request data', details: result.error.issues });
            }

            const { entityId, fileName, mimeType } = result.data;
            let entityType = result.data.entityType;

            // [FIX] Map Aliases from Frontend
            const typeMap: Record<string, string> = {
                'asset': 'assets',
                'work_order': 'work-orders',
                'work-order': 'work-orders',
                'inventory': 'assets',
                'avatar': 'tenant',
                'profile': 'tenant'
            };

            if (typeMap[entityType]) {
                entityType = typeMap[entityType];
            }

            // [SECURITY] Ownership Check (Only if ID is present and looks like a UUID)
            const isUuid = (id?: string) => id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

            if (entityId && isUuid(entityId)) {
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
            }

            logger.info({ tenantId: tenant.id, entityType, entityId, fileName }, 'Generating presigned URL');
            const { url, key } = await this.s3Service.generatePresignedUrl(
                tenant.id,
                entityType as 'assets' | 'work-orders' | 'tenant',
                entityId,
                fileName,
                mimeType
            );

            res.json({ url, key, mimeType });
        } catch (error: any) {
            logger.error({ error, tenantId: tenant?.id }, 'Failed to generate presigned URL');
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    createAttachment = async (req: Request, res: Response) => {
        const tenant = getCurrentTenant();
        try {
            if (!tenant) return res.status(400).json({ error: 'Tenant context missing' });

            const { entityId, key, fileName, mimeType, size } = req.body;
            let entityType = req.body.entityType;

            if (!key) {
                return res.status(400).json({ error: 'Missing S3 key' });
            }

            const typeMap: Record<string, string> = {
                'asset': 'assets',
                'work_order': 'work-orders',
                'work-order': 'work-orders',
                'inventory': 'assets',
                'avatar': 'tenant',
                'profile': 'tenant'
            };
            if (typeMap[entityType]) entityType = typeMap[entityType];

            logger.info({ tenantId: tenant.id, entityType, entityId, key }, 'Creating attachment record');

            const isUuid = (id?: string) => id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            const safeAssetId = (entityType === 'assets' && isUuid(entityId)) ? entityId : undefined;
            const safeWoId = (entityType === 'work-orders' && isUuid(entityId)) ? entityId : undefined;

            const accessKeyId = process.env.AWS_ACCESS_KEY_ID || 'mock-key';
            let url = '';

            if (accessKeyId === 'mock-key' && !process.env.AWS_ENDPOINT) {
                const protocol = req.headers['x-forwarded-proto'] || req.protocol;
                const host = req.get('host');
                const baseUrl = (process.env.NEXT_PUBLIC_API_URL || `${protocol}://${host}`).replace(/\/$/, '');
                url = `${baseUrl}/api/v1/upload/proxy?key=${encodeURIComponent(key)}&tenant=${tenant.slug}`;
            } else {
                const bucket = process.env.AWS_BUCKET_NAME || 'workorderpro-assets';
                const region = process.env.AWS_REGION || 'us-east-1';
                url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

                if (process.env.AWS_ENDPOINT) {
                    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
                    const host = req.get('host');
                    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || `${protocol}://${host}`).replace(/\/$/, '');
                    url = `${baseUrl}/api/v1/upload/proxy?key=${encodeURIComponent(key)}&tenant=${tenant.slug}`;
                }
            }

            const attachment = await this.prisma.attachment.create({
                data: {
                    tenantId: tenant.id,
                    assetId: safeAssetId,
                    workOrderId: safeWoId,
                    fileName,
                    mimeType,
                    size,
                    key,
                    url
                }
            });

            logger.info({ attachmentId: attachment.id, tenantId: tenant.id }, 'Attachment created successfully');
            res.status(201).json(attachment);

        } catch (error: any) {
            logger.error({ error, tenantId: tenant?.id }, 'Failed to create attachment');
            res.status(500).json({ error: error.message });
        }
    }

    proxy = async (req: Request, res: Response) => {
        const tenant = getCurrentTenant();
        try {
            if (!tenant) return res.status(400).json({ error: 'Tenant context missing' });

            const key = req.query.key as string;
            if (!key) return res.status(400).json({ error: 'Missing key' });

            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

            if (!key.startsWith(`tenants/${tenant.id}/`)) {
                logger.warn({ tenantId: tenant.id, key }, 'Unauthorized proxy access attempt: key does not belong to tenant');
                return res.status(403).json({ error: 'Access Denied: File does not belong to this tenant' });
            }

            logger.debug({ tenantId: tenant.id, key }, 'Proxying file access');

            const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "mock-key";
            if (accessKeyId === "mock-key" && !process.env.AWS_ENDPOINT) {
                const uploadDir = path.join(process.cwd(), 'uploads');
                const filePath = path.join(uploadDir, key);
                if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

                if (key.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
                if (key.endsWith('.jpg') || key.endsWith('.jpeg')) res.setHeader('Content-Type', 'image/jpeg');

                return res.sendFile(filePath);
            }

            const { body, contentType } = await this.s3Service.getObjectStream(key);

            if (contentType && contentType !== 'application/octet-stream' && contentType !== 'binary/octet-stream') {
                res.setHeader('Content-Type', contentType);
            } else {
                if (key.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
                else if (key.endsWith('.jpg') || key.endsWith('.jpeg')) res.setHeader('Content-Type', 'image/jpeg');
                else res.setHeader('Content-Type', 'application/octet-stream');
            }

            if (body && typeof (body as any).pipe === 'function') {
                (body as any).pipe(res);
            } else {
                const buffer = await (body as any).transformToByteArray();
                res.end(buffer);
            }

        } catch (error: any) {
            logger.error({ error, tenantId: tenant?.id, key: req.query.key }, 'Proxy access error');
            if (!res.headersSent) res.status(500).send('File Access Error');
        }
    };

    localSink = async (req: Request, res: Response) => {
        try {
            const key = req.query.key as string;
            if (!key) return res.status(400).json({ error: 'Missing key' });

            if (key.includes('..')) return res.status(400).json({ error: 'Invalid key' });

            const uploadDir = path.join(process.cwd(), 'uploads');
            const filePath = path.join(uploadDir, key);

            if (req.method === 'PUT') {
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                const writeStream = fs.createWriteStream(filePath);
                req.pipe(writeStream);

                writeStream.on('finish', () => {
                    logger.debug({ key }, 'Local sink write completed');
                    res.status(200).send('Uploaded');
                });
                writeStream.on('error', (err) => {
                    logger.error({ error: err, key }, 'Local sink write failed');
                    res.status(500).send('Write failed');
                });
            } else if (req.method === 'GET') {
                if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
                res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.sendFile(filePath);
            } else {
                res.status(405).send('Method Not Allowed');
            }

        } catch (error: any) {
            logger.error({ error, key: req.query.key }, 'Local sink operation failed');
            res.status(500).json({ error: error.message });
        }
    }
}
