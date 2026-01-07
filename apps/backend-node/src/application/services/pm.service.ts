import { PrismaClient } from '@prisma/client';
import { addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns';

const prisma = new PrismaClient();

export class PMService {
    /**
     * Calculate next due date based on frequency
     */
    static calculateNextDueDate(currentDate: Date, frequency: string): Date {
        switch (frequency) {
            case 'DAILY':
                return addDays(currentDate, 1);
            case 'WEEKLY':
                return addWeeks(currentDate, 1);
            case 'MONTHLY':
                return addMonths(currentDate, 1);
            case 'QUARTERLY':
                return addQuarters(currentDate, 1);
            case 'YEARLY':
                return addYears(currentDate, 1);
            default:
                return addMonths(currentDate, 1);
        }
    }

    /**
     * Create a PM Schedule
     */
    async createSchedule(data: {
        tenantId: string;
        assetId: string;
        title: string;
        description?: string;
        frequency: string;
        startDate: string;
        checklistTemplateId?: string;
        createdById?: string;
    }) {
        const startDate = new Date(data.startDate);

        return prisma.pMSchedule.create({
            data: {
                tenantId: data.tenantId,
                assetId: data.assetId,
                title: data.title,
                description: data.description,
                frequency: data.frequency,
                startDate: startDate,
                nextDueDate: startDate, // First one is on start date
                checklistTemplateId: data.checklistTemplateId,
                createdById: data.createdById
            }
        });
    }

    /**
     * Get all schedules for a tenant
     */
    async getSchedules(tenantId: string) {
        return prisma.pMSchedule.findMany({
            where: { tenantId },
            include: {
                asset: { select: { name: true } },
                checklistTemplate: { select: { name: true } }
            }
        });
    }

    /**
     * Process due PMs and generate Work Orders
     * This would typically be called by a cron job
     */
    async processDuePMs(tenantId?: string) {
        const where: any = {
            active: true,
            nextDueDate: { lte: new Date() }
        };
        if (tenantId) where.tenantId = tenantId;

        const dueSchedules = await prisma.pMSchedule.findMany({
            where,
            include: { checklistTemplate: { include: { items: true } } }
        });

        for (const schedule of dueSchedules) {
            await this.generateWorkOrder(schedule);
        }

        return dueSchedules.length;
    }

    /**
     * Generate a Work Order from a schedule
     */
    private async generateWorkOrder(schedule: any) {
        return prisma.$transaction(async (tx) => {
            // 1. Create Work Order
            const workOrder = await tx.workOrder.create({
                data: {
                    tenantId: schedule.tenantId,
                    assetId: schedule.assetId,
                    title: `[PM] ${schedule.title}`,
                    description: schedule.description,
                    priority: 'MEDIUM',
                    status: 'OPEN',
                    type: 'PREVENTIVE',
                    rimeScore: 10, // Default for now
                    pmScheduleId: schedule.id,
                }
            });

            // 2. If template exists, create Work Order Checklist
            if (schedule.checklistTemplate) {
                const checklist = await tx.workOrderChecklist.create({
                    data: {
                        workOrderId: workOrder.id,
                    }
                });

                // 3. Clone template items to the WO Checklist
                const items = schedule.checklistTemplate.items.map((item: any) => ({
                    checklistId: checklist.id,
                    task: item.task,
                    order: item.order,
                    isCompleted: false
                }));

                await tx.workOrderChecklistItem.createMany({
                    data: items
                });
            }

            // 4. Update Next Due Date
            const nextDueDate = PMService.calculateNextDueDate(schedule.nextDueDate, schedule.frequency);
            await tx.pMSchedule.update({
                where: { id: schedule.id },
                data: { nextDueDate }
            });

            return workOrder;
        });
    }

    /**
     * Get checklist for a specific Work Order
     */
    async getWorkOrderChecklist(workOrderId: string) {
        return prisma.workOrderChecklist.findFirst({
            where: { workOrderId },
            include: { items: { orderBy: { order: 'asc' } } }
        });
    }

    /**
     * Update checklist item (Sign-off)
     */
    async signOffChecklistItem(itemId: string, userId: string, isCompleted: boolean) {
        return prisma.workOrderChecklistItem.update({
            where: { id: itemId },
            data: {
                isCompleted,
                completedAt: isCompleted ? new Date() : null,
                completedBy: isCompleted ? userId : null
            }
        });
    }
}
