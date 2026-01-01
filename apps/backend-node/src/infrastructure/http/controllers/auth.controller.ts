import { Request, Response } from 'express';
import { getCurrentTenant } from '../../middleware/tenant.middleware';

export class AuthController {
    login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const tenant = getCurrentTenant();

            // [MOCK] Simple Auth for Phase 1/Deployment Verification
            // In a real app, verify against DB (User table).
            // For now, allow any non-empty login or specific demo creds.

            if (email === 'demo@demo.com' && password === 'password') {
                // Success
                (req.session as any).user = {
                    id: 'demo-user-123',
                    email: email,
                    role: 'admin'
                };

                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        return res.status(500).json({ error: 'Session save failed' });
                    }

                    // [PHASE 22] Cookie Mirror: Prove the backend generated the session
                    res.json({
                        success: true,
                        user: (req.session as any).user,
                        message: 'Logged in successfully (Mock)',
                        debug: {
                            sessionID: req.sessionID,
                            cookieHeader: res.get('Set-Cookie') // [DEBUG] Critical: See if Express generated it
                        }
                    });
                    console.log('✅ Login successful for:', email);
                    console.log('🍪 Session ID created:', req.sessionID);
                });
                return;
            }

            res.status(401).json({ error: 'Invalid credentials. Try demo@demo.com / password' });

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
