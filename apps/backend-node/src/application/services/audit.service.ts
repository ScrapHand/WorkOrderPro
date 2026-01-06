import { PrismaClient } from '@prisma/client';

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
            console.error('[AuditService] Failed to create audit log:', error);
            // Non-blocking for the main operation
        }
    }
}
