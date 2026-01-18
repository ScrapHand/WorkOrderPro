
import { PrismaClient } from '@prisma/client';

export class CommentService {
    constructor(private prisma: PrismaClient) { }

    async addComment(tenantId: string, workOrderId: string, userId: string, content: string) {
        return this.prisma.workOrderComment.create({
            data: {
                tenantId,
                workOrderId,
                userId,
                content
            },
            include: {
                user: { select: { id: true, username: true, avatarUrl: true } }
            }
        });
    }

    async getComments(workOrderId: string, tenantId: string) {
        return this.prisma.workOrderComment.findMany({
            where: { workOrderId, tenantId },
            include: {
                user: { select: { id: true, username: true, avatarUrl: true } }
            },
            orderBy: { createdAt: 'asc' }
        });
    }
}
