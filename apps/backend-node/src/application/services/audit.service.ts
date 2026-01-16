import { PrismaClient } from '@prisma/client';
import { logger } from '../../infrastructure/logging/logger';

export class AuditService {
    constructor(private prisma: PrismaClient) { }

    async log(params: {
        tenantId?: string;
        userId?: string;
        event: string;
        resource?: string;
        resourceId?: string;
        metadata?: any;
    }) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    tenantId: params.tenantId,
                    userId: params.userId,
                    event: params.event,
                    resource: params.resource,
                    resourceId: params.resourceId,
                    metadata: params.metadata || {}
                }
            });
        } catch (error) {
            logger.error({ error, params }, 'Failed to create audit log');
            // Non-blocking for the main operation
        }
    }
}
