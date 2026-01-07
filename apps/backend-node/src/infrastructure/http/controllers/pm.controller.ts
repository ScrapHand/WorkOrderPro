import { Request, Response } from 'express';
import { PMService } from '../../../application/services/pm.service';
import { ChecklistTemplateService } from '../../../application/services/checklist-template.service';

const pmService = new PMService();
const templateService = new ChecklistTemplateService();

export class PMController {
    /**
     * Schedules
     */
    createSchedule = async (req: Request, res: Response) => {
        try {
            const tenantId = (req.session as any)?.user?.tenantId;
            const userId = (req.session as any)?.user?.id;
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            const schedule = await pmService.createSchedule({
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
            const tenantId = (req.session as any)?.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            const schedules = await pmService.getSchedules(tenantId);
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
            const tenantId = (req.session as any)?.user?.tenantId;
            const userId = (req.session as any)?.user?.id;
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            const template = await templateService.createTemplate({
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
            const tenantId = (req.session as any)?.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

            const templates = await templateService.getTemplates(tenantId);
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
            const checklist = await pmService.getWorkOrderChecklist(workOrderId);
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

            const item = await pmService.signOffChecklistItem(itemId, userId, isCompleted);
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
            const tenantId = (req.session as any)?.user?.tenantId;
            const count = await pmService.processDuePMs(tenantId);
            res.json({ message: `Processed ${count} due PM schedules.` });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
