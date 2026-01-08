import { Request, Response } from 'express';
import { PMService } from '../../../application/services/pm.service';
import { ChecklistTemplateService } from '../../../application/services/checklist-template.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';

export class PMController {
    constructor(
        private pmService: PMService,
        private templateService: ChecklistTemplateService
    ) { }
    /**
     * Schedules
     */
    createSchedule = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(401).json({ error: 'Unauthorized' });
            const tenantId = tenantCtx.id;
            const userId = (req.session as any)?.user?.id;

            const schedule = await this.pmService.createSchedule({
                ...req.body,
                tenantId,
                createdById: userId
            });
            res.status(201).json(schedule);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getSchedules = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(401).json({ error: 'Unauthorized' });
            const tenantId = tenantCtx.id;

            const schedules = await this.pmService.getSchedules(tenantId);
            res.json(schedules);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Templates
     */
    createTemplate = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(401).json({ error: 'Unauthorized' });
            const tenantId = tenantCtx.id;
            const userId = (req.session as any)?.user?.id;

            const template = await this.templateService.createTemplate({
                ...req.body,
                tenantId,
                createdById: userId
            });
            res.status(201).json(template);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getTemplates = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(401).json({ error: 'Unauthorized' });
            const tenantId = tenantCtx.id;

            const templates = await this.templateService.getTemplates(tenantId);
            res.json(templates);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Checklist Sign-off
     */
    getWorkOrderChecklist = async (req: Request, res: Response) => {
        try {
            const { workOrderId } = req.params;
            const checklist = await this.pmService.getWorkOrderChecklist(workOrderId);
            res.json(checklist);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    signOffItem = async (req: Request, res: Response) => {
        try {
            const { itemId } = req.params;
            const { isCompleted } = req.body;
            const userId = (req.session as any)?.user?.id;

            const item = await this.pmService.signOffChecklistItem(itemId, userId, isCompleted);
            res.json(item);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Manual Trigger for PM Processing
     */
    triggerPMs = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            const tenantId = tenantCtx?.id;
            const count = await this.pmService.processDuePMs(tenantId);
            res.json({ message: `Processed ${count} due PM schedules.` });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    triggerSchedule = async (req: Request, res: Response) => {
        try {
            const ctx = getCurrentTenant();
            if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

            const { id } = req.params;
            const workOrder = await this.pmService.processScheduleById(id, ctx.id);
            res.status(201).json(workOrder);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
