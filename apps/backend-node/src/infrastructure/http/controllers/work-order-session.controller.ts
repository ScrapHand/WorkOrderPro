import { Request, Response } from 'express';
import { WorkOrderSessionService } from '../../../application/services/work-order-session.service';

export class WorkOrderSessionController {
    constructor(private service: WorkOrderSessionService) { }

    start = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { workOrderId } = req.params;
            const session = await this.service.startSession(user.tenantId, workOrderId, user.id);
            res.status(201).json(session);
        } catch (error) {
            console.error('Start Session Error:', error);
            res.status(500).json({ error: 'Failed to start session' });
        }
    }

    stop = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { workOrderId } = req.params;
            const session = await this.service.stopSession(user.tenantId, workOrderId, user.id);
            res.json(session);
        } catch (error) {
            console.error('Stop Session Error:', error);
            res.status(500).json({ error: 'Failed to stop session' });
        }
    }

    pause = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { workOrderId } = req.params;
            await this.service.pauseWorkOrder(user.tenantId, workOrderId);
            res.json({ message: 'Work Order paused' });
        } catch (error) {
            console.error('Pause Session Error:', error);
            res.status(500).json({ error: 'Failed to pause work order' });
        }
    }

    complete = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { workOrderId } = req.params;
            const { notes, parts } = req.body;
            await this.service.completeWorkOrder(user.tenantId, workOrderId, notes, parts);
            res.json({ message: 'Work Order completed' });
        } catch (error) {
            console.error('Complete Session Error:', error);
            res.status(500).json({ error: 'Failed to complete work order' });
        }
    }

    getSessions = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { workOrderId } = req.params;
            const sessions = await this.service.getSessions(user.tenantId, workOrderId);
            res.json(sessions);
        } catch (error) {
            console.error('Get Sessions Error:', error);
            res.status(500).json({ error: 'Failed to fetch sessions' });
        }
    }

    myActive = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const activeItems = await this.service.getActiveWorkOrdersForUser(user.tenantId, user.id);
            res.json(activeItems);
        } catch (error) {
            console.error('My Active Sessions Error:', error);
            res.status(500).json({ error: 'Failed to fetch active tasks' });
        }
    }
}
