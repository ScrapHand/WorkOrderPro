import { Request, Response, NextFunction } from 'express';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    // 1. Check Session
    if (req.session && (req.session as any).user) {
        // 2. Attach to req.user for controllers
        (req as any).user = (req.session as any).user;
        // Legacy support if needed, but let's try to move to req.user
        (req as any).existingUser = (req.session as any).user;
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized: Please log in' });
    }
};
