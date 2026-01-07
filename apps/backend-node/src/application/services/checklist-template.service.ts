import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ChecklistTemplateService {
    /**
     * Create a template with items
     */
    async createTemplate(data: {
        tenantId: string;
        name: string;
        description?: string;
        createdById?: string;
        items: { task: string; isRequired: boolean; order: number }[];
    }) {
        return prisma.checklistTemplate.create({
            data: {
                tenantId: data.tenantId,
                name: data.name,
                description: data.description,
                createdById: data.createdById,
                items: {
                    create: data.items
                }
            },
            include: { items: true }
        });
    }

    /**
     * Get all templates for a tenant
     */
    async getTemplates(tenantId: string) {
        return prisma.checklistTemplate.findMany({
            where: { tenantId },
            include: { items: { orderBy: { order: 'asc' } } }
        });
    }

    /**
     * Delete a template
     */
    async deleteTemplate(id: string, tenantId: string) {
        return prisma.checklistTemplate.delete({
            where: { id, tenantId }
        });
    }
}
