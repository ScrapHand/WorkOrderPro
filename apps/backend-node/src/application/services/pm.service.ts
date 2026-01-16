
import { PrismaClient, PMSchedule } from '@prisma/client';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { logger } from '../../infrastructure/logging/logger';

export class PMService {
    constructor(private prisma: PrismaClient) { }

    async createSchedule(tenantId: string, data: any) {
        const nextDueDate = data.nextDueDate ? new Date(data.nextDueDate) : new Date();

        return this.prisma.pMSchedule.create({
            data: {
                tenantId,
                assetId: data.assetId,
                title: data.title,
                description: data.description,
                frequencyType: data.frequencyType || 'days',
                frequencyInterval: data.frequencyInterval || 1,
                nextDueDate,
                assignedToUserId: data.assignedToUserId,
                checklistTemplateId: data.checklistTemplateId
            }
        });
    }

    async getAllSchedules(tenantId: string) {
        return this.prisma.pMSchedule.findMany({
            where: { tenantId },
            include: { asset: { select: { id: true, name: true } } },
            orderBy: { nextDueDate: 'asc' }
        });
    }

    async getScheduleById(id: string, tenantId: string) {
        return this.prisma.pMSchedule.findFirst({
            where: { id, tenantId },
            include: { asset: true, checklistTemplate: true }
        });
    }

    async updateSchedule(id: string, tenantId: string, data: any) {
        return this.prisma.pMSchedule.update({
            where: { id, tenantId },
            data
        });
    }

    async deleteSchedule(id: string, tenantId: string) {
        return this.prisma.pMSchedule.delete({
            where: { id, tenantId }
        });
    }

    /**
     * PM Sign-off logic
     * Completes a PM, creates a log, and moves the next due date forward.
     */
    async signOff(id: string, tenantId: string, userId: string, notes?: string) {
        const schedule = await this.prisma.pMSchedule.findUnique({
            where: { id }
        });

        if (!schedule) throw new Error('Schedule not found');

        const now = new Date();
        const currentDue = schedule.nextDueDate;
        const nextDue = this.calculateNextDue(currentDue, schedule.frequencyType, schedule.frequencyInterval);

        return this.prisma.$transaction(async (tx) => {
            // 1. Create PMLog
            await tx.pMLog.create({
                data: {
                    tenantId,
                    pmScheduleId: schedule.id,
                    completedAt: now,
                    completedByUserId: userId,
                    notes
                }
            });

            // 2. Update Schedule
            return await tx.pMSchedule.update({
                where: { id },
                data: {
                    lastPerformedAt: now,
                    nextDueDate: nextDue
                }
            });
        });
    }

    /**
     * Generate a Work Order from a PM Schedule
     */
    async generateWorkOrder(id: string, tenantId: string) {
        const schedule = await this.prisma.pMSchedule.findUnique({
            where: { id },
            include: { checklistTemplate: { include: { items: true } } }
        });

        if (!schedule) throw new Error('Schedule not found');

        return this.prisma.$transaction(async (tx) => {
            // 1. Create WO
            const wo = await tx.workOrder.create({
                data: {
                    tenantId,
                    assetId: schedule.assetId,
                    title: `PM: ${schedule.title}`,
                    description: schedule.description || `Generated from PM Schedule ${schedule.id}`,
                    priority: 'MEDIUM',
                    status: 'OPEN',
                    type: 'PREVENTIVE',
                    pmScheduleId: schedule.id,
                    assignedUserId: schedule.assignedToUserId,
                    rimeScore: 0 // Default to 0, or fetch asset to calculate properly. TODO: Inject RimeService for proper calculation
                }
            });

            // 2. Create Checklist if template exists
            if (schedule.checklistTemplate) {
                const checklist = await tx.workOrderChecklist.create({
                    data: {
                        workOrderId: wo.id
                    }
                });

                await tx.workOrderChecklistItem.createMany({
                    data: schedule.checklistTemplate.items.map(item => ({
                        checklistId: checklist.id,
                        task: item.task,
                        isRequired: item.isRequired,
                        order: item.order
                    }))
                });
            }

            return wo;
        });
    }

    private calculateNextDue(currentDue: Date, type: string, interval: number): Date {
        const t = (type || 'days').toLowerCase();
        switch (t) {
            case 'daily': return addDays(currentDue, 1);
            case 'weekly': return addWeeks(currentDue, 1);
            case 'fortnightly': return addWeeks(currentDue, 2);
            case 'monthly': return addMonths(currentDue, 1);
            case 'quarterly': return addMonths(currentDue, 3);
            case '6 monthly': return addMonths(currentDue, 6);
            case 'yearly': return addYears(currentDue, 1);

            // Interval based
            case 'days': return addDays(currentDue, interval);
            case 'weeks': return addWeeks(currentDue, interval);
            case 'months': return addMonths(currentDue, interval);
            case 'years': return addYears(currentDue, interval);

            default: return addDays(currentDue, interval);
        }
    }
}
