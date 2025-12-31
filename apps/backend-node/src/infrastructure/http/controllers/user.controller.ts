import { Request, Response } from 'express';
import { UserService } from '../../../application/services/user.service';
import { getCurrentTenant } from '../../middleware/tenant.middleware';

export class UserController {
    constructor(private userService: UserService) { }

    create = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant();
            if (!tenant) return res.status(400).json({ error: 'Tenant context missing' });

            const { email, role, password } = req.body;

            // Basic validation
            if (!email) return res.status(400).json({ error: 'Email is required' });

            const user = await this.userService.createUser(tenant.id, email, role || 'VIEWER', password);

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

    getAll = async (req: Request, res: Response) => {
        try {
            const tenant = getCurrentTenant();
            if (!tenant) return res.status(400).json({ error: 'Tenant context missing' });

            const users = await this.userService.getAllUsers(tenant.id);
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
