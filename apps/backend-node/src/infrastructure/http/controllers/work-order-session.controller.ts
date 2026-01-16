import { Request, Response } from 'express';
import { WorkOrderSessionService } from '../../../application/services/work-order-session.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { logger } from '../../logging/logger';

export class WorkOrderSessionController {
    constructor(private service: WorkOrderSessionService) { }

    start = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const user = (req as any).user;
        const { workOrderId } = req.params;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            logger.info({ tenantId, workOrderId, userId: user.id }, 'Starting work order session');
            const session = await this.service.startSession(tenantId, workOrderId, user.id);

            logger.info({ sessionId: session.id, workOrderId, tenantId }, 'Work order session started');
            res.status(201).json(session);
        } catch (error) {
            logger.error({ error, tenantId, workOrderId, userId: user?.id }, 'Failed to start work order session');
            res.status(500).json({ error: 'Failed to start session' });
        }
    }

    stop = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const user = (req as any).user;
        const { workOrderId } = req.params;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            logger.info({ tenantId, workOrderId, userId: user.id }, 'Stopping work order session');
            const session = await this.service.stopSession(tenantId, workOrderId, user.id);

            if (!session) {
                logger.warn({ tenantId, workOrderId, userId: user.id }, 'No active session found to stop');
                return res.status(404).json({ error: 'No active session found' });
            }

            logger.info({ sessionId: session.id, workOrderId, tenantId }, 'Work order session stopped');
            res.json(session);
        } catch (error) {
            logger.error({ error, tenantId, workOrderId, userId: user?.id }, 'Failed to stop work order session');
            res.status(500).json({ error: 'Failed to stop session' });
        }
    }

    pause = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { workOrderId } = req.params;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            logger.info({ tenantId, workOrderId }, 'Pausing work order');
            await this.service.pauseWorkOrder(tenantId, workOrderId);

            logger.info({ workOrderId, tenantId }, 'Work order paused');
            res.json({ message: 'Work Order paused' });
        } catch (error) {
            logger.error({ error, tenantId, workOrderId }, 'Failed to pause work order');
            res.status(500).json({ error: 'Failed to pause work order' });
        }
    }

    complete = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { workOrderId } = req.params;
        const { notes, parts } = req.body;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            logger.info({ tenantId, workOrderId }, 'Completing work order');
            await this.service.completeWorkOrder(tenantId, workOrderId, notes, parts);

            logger.info({ workOrderId, tenantId }, 'Work order completed');
            res.json({ message: 'Work Order completed' });
        } catch (error) {
            logger.error({ error, tenantId, workOrderId }, 'Failed to complete work order');
            res.status(500).json({ error: 'Failed to complete work order' });
        }
    }

    getSessions = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { workOrderId } = req.params;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            logger.info({ tenantId, workOrderId }, 'Fetching work order sessions');
            const sessions = await this.service.getSessions(tenantId, workOrderId);
            res.json(sessions);
        } catch (error) {
            logger.error({ error, tenantId, workOrderId }, 'Failed to fetch work order sessions');
            res.status(500).json({ error: 'Failed to fetch sessions' });
        }
    }

    myActive = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const user = (req as any).user;
        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            logger.info({ tenantId, userId: user.id }, 'Fetching active work orders for user');
            const activeItems = await this.service.getActiveWorkOrdersForUser(tenantId, user.id);
            res.json(activeItems);
        } catch (error) {
            logger.error({ error, tenantId, userId: user?.id }, 'Failed to fetch active work orders for user');
            res.status(500).json({ error: 'Failed to fetch active tasks' });
        }
    }
}
