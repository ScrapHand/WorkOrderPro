import { Request, Response } from 'express';
import { UserService } from '../../../application/services/user.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';

export class UserController {
    constructor(private userService: UserService) { }

    create = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const tenantId = await this.userService.resolveTenantId(tenantCtx.slug);
            if (!tenantId) return res.status(404).json({ error: 'Tenant not found' });

            const { email, role, password, username } = req.body;

            // Basic validation
            if (!email) return res.status(400).json({ error: 'Email is required' });

            const user = await this.userService.createUser(tenantId, email, role || 'VIEWER', password, username);

            // Return user without password hash
            const { passwordHash, ...safeUser } = user;
            res.status(201).json(safeUser);
        } catch (error: any) {
            console.error('Create User Error:', error);
            if (error.code === 'P2002') {
                return res.status(409).json({ error: 'Email already exists' });
            }
            res.status(500).json({ error: error.message });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const user = await this.userService.updateUser(id, req.body);
            const { passwordHash, ...safeUser } = user;
            res.json(safeUser);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await this.userService.deleteUser(id);
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            const tenantCtx = getCurrentTenant();
            if (!tenantCtx) return res.status(400).json({ error: 'Tenant context missing' });

            const tenantId = await this.userService.resolveTenantId(tenantCtx.slug);
            if (!tenantId) return res.status(404).json({ error: 'Tenant not found' });

            const users = await this.userService.getAllUsers(tenantId);
            const safeUsers = users.map(u => {
                const { passwordHash, ...rest } = u;
                return rest;
            });

            res.json(safeUsers);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
