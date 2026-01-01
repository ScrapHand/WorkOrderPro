import { Request, Response } from 'express';
import { getCurrentTenant } from '../../middleware/tenant.middleware';
import { UserService } from '../../../application/services/user.service';
import bcrypt from 'bcryptjs';

export class AuthController {
    constructor(private userService: UserService) { }

    login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;

            // 1. Try Real Auth
            let user = await this.userService.findByEmail(email);
            let isValid = false;

            if (user) {
                isValid = await bcrypt.compare(password, user.passwordHash);
            } else if (email === 'demo@demo.com' && password === 'password') {
                // 2. Fallback: Demo User (if not in DB)
                isValid = true;
                user = {
                    id: 'demo-user-123',
                    email: email,
                    role: 'admin',
                    passwordHash: '',
                    tenantId: 'default',
                    createdAt: new Date(),
                    updatedAt: new Date()
                } as any;
            }

            if (!isValid || !user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // 3. Success: Set Session Data
            (req.session as any).user = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            // 4. Force Save to DB
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({ error: 'Session save failed' });
                }

                // [PHASE 23] Cookie Mirror
                res.json({
                    success: true,
                    user: (req.session as any).user,
                    message: 'Logged in successfully',
                    debug: {
                        sessionID: req.sessionID,
                        cookieHeader: res.get('Set-Cookie')
                    }
                });
                console.log('✅ Login successful for:', email);
                console.log('🍪 Session ID saved:', req.sessionID);
            });

        } catch (error: any) {
            console.error('Login Error:', error);
            res.status(500).json({ error: error.message });
        }
    };

    logout = async (req: Request, res: Response) => {
        req.session.destroy((err) => {
            if (err) return res.status(500).json({ error: 'Logout failed' });
            res.clearCookie('wop_session');
            res.json({ success: true, message: 'Logged out' });
        });
    };

    // Check if session is valid
    me = async (req: Request, res: Response) => {
        if ((req.session as any).user) {
            res.json({ isAuthenticated: true, user: (req.session as any).user });
        } else {
            console.log('❌ Auth Check Failed. Session:', req.session); // [LOGGING] Phase 14
            res.status(401).json({ isAuthenticated: false });
        }
    };
}
