
import { Request, Response } from 'express';
import { PMService } from '../../../application/services/pm.service';
import { ChecklistTemplateService } from '../../../application/services/checklist-template.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { logger } from '../../logging/logger';

export class PMController {
    constructor(
        private pmService: PMService,
        private templateService: ChecklistTemplateService
    ) { }

    // PMSchedule Endpoints (Legacy Parity + Modern)

    getAll = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            logger.info({ tenantId }, 'Fetching all PM schedules');
            const schedules = await this.pmService.getAllSchedules(tenantId);
            res.json(schedules);
        } catch (error) {
            logger.error({ error, tenantId }, 'Failed to fetch PM schedules');
            res.status(500).json({ error: 'Failed to fetch PM schedules' });
        }
    };

    create = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            const { title } = req.body;
            logger.info({ tenantId, title }, 'Creating new PM schedule');

            const schedule = await this.pmService.createSchedule(tenantId, req.body);
            res.status(201).json(schedule);
        } catch (error) {
            logger.error({ error, tenantId }, 'Failed to create PM schedule');
            res.status(500).json({ error: 'Failed to create PM schedule' });
        }
    };

    getById = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { id } = req.params;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            const schedule = await this.pmService.getScheduleById(id, tenantId);
            if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

            res.json(schedule);
        } catch (error) {
            logger.error({ error, id, tenantId }, 'Failed to fetch PM schedule');
            res.status(500).json({ error: 'Failed to fetch PM schedule' });
        }
    };

    update = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { id } = req.params;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            const schedule = await this.pmService.updateSchedule(id, tenantId, req.body);
            res.json(schedule);
        } catch (error) {
            logger.error({ error, id, tenantId }, 'Failed to update PM schedule');
            res.status(500).json({ error: 'Failed to update PM schedule' });
        }
    };

    delete = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { id } = req.params;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            await this.pmService.deleteSchedule(id, tenantId);
            res.status(204).send();
        } catch (error) {
            logger.error({ error, id, tenantId }, 'Failed to delete PM schedule');
            res.status(500).json({ error: 'Failed to delete PM schedule' });
        }
    };

    signOff = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const userId = (req as any).user?.id || (req as any).session?.user?.id;
        const { id } = req.params;
        const { notes } = req.body;

        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });
            if (!userId) return res.status(401).json({ error: 'User context missing' });

            logger.info({ id, tenantId, userId }, 'Signing off PM schedule');
            const result = await this.pmService.signOff(id, tenantId, userId, notes);

            res.json({ message: 'PM signed off successfully', nextDueDate: result.nextDueDate });
        } catch (error) {
            logger.error({ error, id, tenantId }, 'Failed to sign off PM');
            res.status(500).json({ error: 'Failed to sign off PM' });
        }
    };

    trigger = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { id } = req.params;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            logger.info({ id, tenantId }, 'Manually triggering PM work order generation');
            const wo = await this.pmService.generateWorkOrder(id, tenantId);
            res.status(201).json(wo);
        } catch (error) {
            logger.error({ error, id, tenantId }, 'Failed to trigger PM work order');
            res.status(500).json({ error: 'Failed to generate WO from PM' });
        }
    };

    // Checklist Template Endpoints

    getTemplates = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });
            const templates = await this.templateService.getTemplates(tenantId);
            res.json(templates);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch templates' });
        }
    };

    createTemplate = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const userId = (req as any).user?.id || (req as any).session?.user?.id;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });
            const template = await this.templateService.createTemplate({
                ...req.body,
                tenantId,
                createdById: userId
            });
            res.status(201).json(template);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create template' });
        }
    };
}
