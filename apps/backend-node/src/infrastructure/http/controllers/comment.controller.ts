
import { Request, Response } from 'express';
import { CommentService } from '../../../application/services/comment.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';

export class CommentController {
    constructor(private commentService: CommentService) { }

    add = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const user = (req.session as any)?.user;
        const { workOrderId } = req.params;

        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            const comment = await this.commentService.addComment(tenantId, workOrderId, user.id, req.body.content);
            res.status(201).json(comment);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getAll = async (req: Request, res: Response) => {
        const tenantCtx = getCurrentTenant();
        const tenantId = tenantCtx?.id;
        const { workOrderId } = req.params;

        try {
            if (!tenantId) return res.status(400).json({ error: 'Tenant context missing' });

            const comments = await this.commentService.getComments(workOrderId, tenantId);
            res.json(comments);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
