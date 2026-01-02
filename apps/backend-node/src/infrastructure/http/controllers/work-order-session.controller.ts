import { Request, Response } from 'express';
import { WorkOrderSessionService } from '../../../application/services/work-order-session.service';

export class WorkOrderSessionController {
    constructor(private service: WorkOrderSessionService) { }

    start = async (req: Request, res: Response) => {
        try {
            const { existingUser } = req as any;
            const { workOrderId } = req.params;
            const session = await this.service.startSession(existingUser.tenantId, workOrderId, existingUser.id);
            res.status(201).json(session);
        } catch (error) {
            res.status(500).json({ error: 'Failed to start session' });
        }
    }

    stop = async (req: Request, res: Response) => {
        try {
            const { existingUser } = req as any;
            const { workOrderId } = req.params;
            const session = await this.service.stopSession(existingUser.tenantId, workOrderId, existingUser.id);
            res.json(session);
        } catch (error) {
            res.status(500).json({ error: 'Failed to stop session' });
        }
    }

    pause = async (req: Request, res: Response) => {
        try {
            const { existingUser } = req as any;
            const { workOrderId } = req.params;
            await this.service.pauseWorkOrder(existingUser.tenantId, workOrderId);
            res.json({ message: 'Work Order paused' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to pause work order' });
        }
    }

    complete = async (req: Request, res: Response) => {
        try {
            const { existingUser } = req as any;
            const { workOrderId } = req.params;
            const { notes } = req.body;
            await this.service.completeWorkOrder(existingUser.tenantId, workOrderId, notes);
            res.json({ message: 'Work Order completed' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to complete work order' });
        }
    }

    getSessions = async (req: Request, res: Response) => {
        try {
            const { existingUser } = req as any;
            const { workOrderId } = req.params;
            const sessions = await this.service.getSessions(existingUser.tenantId, workOrderId);
            res.json(sessions);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch sessions' });
        }
    }
}
