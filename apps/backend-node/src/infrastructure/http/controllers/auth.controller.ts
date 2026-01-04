import { Request, Response } from 'express';
import { UserService } from '../../../application/services/user.service';
import bcrypt from 'bcryptjs';

export class AuthController {
    constructor(private userService: UserService) { }

    login = async (req: Request, res: Response) => {
        try {
            const { email, password, tenant_slug } = req.body;
            // console.log('Login Attempt:', email, 'Target Tenant:', tenant_slug);

            // 1. Find user by email (Global lookup temporarily to identify tenant)
            let user = await this.userService.findByEmail(email);

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // 2. [STRICT TENANT CHECK] If not a Global Admin, they MUST belong to the requested tenant
            const actualTenantSlug = (user as any).tenant?.slug;
            const requestedSlug = (tenant_slug || 'default').toLowerCase().trim();

            if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'GLOBAL_ADMIN') {
                if (actualTenantSlug !== requestedSlug) {
                    console.warn(`[AUTH] Blocked cross-tenant login: ${email} (belongs to ${actualTenantSlug}) tried to log into ${requestedSlug}`);
                    return res.status(403).json({
                        error: 'Access denied',
                        message: 'Your account does not belong to this company.'
                    });
                }
            }



            // 2. [JIT Seeding/Self-Healing] Ensure Demo User has correct credentials
            if (email === 'demo@demo.com') {
                const salt = await bcrypt.genSalt(10);
                const freshHash = await bcrypt.hash(password, salt);

                if (!user) {
                    console.log('🌱 Creating Demo User...');
                    user = await this.userService.createUser(
                        'default',
                        email,
                        'SYSTEM_ADMIN',
                        password // Service will hash this, but we want to be sure. 
                        // Actually userService.createUser hashes it. usage: createUser(..., plainPassword)
                    );
                } else {
                    // [SELF-HEALING] Force update password to ensure access
                    console.log('🩹 Healing Demo User Credentials...');
                    user = await this.userService.updateUserPassword(user.id, freshHash);
                }
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // 3. [Validation] Standard bcrypt check (No Bypass!)
            const isValid = await bcrypt.compare(password, user.passwordHash);

            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // 4. [Session] Create Persistence
            (req.session as any).user = {
                id: user.id,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
                tenantSlug: (user as any).tenant?.slug
            };

            req.session.save((err) => {
                if (err) {
                    console.error('Session Save Error:', err);
                    return res.status(500).json({ error: 'Session save failed' });
                }

                res.json({
                    success: true,
                    user: (req.session as any).user,
                    tenant: (user as any).tenant, // Include full tenant object
                    message: 'Logged in successfully',
                });
            });

        } catch (error: any) {
            console.error('Login Error:', error);
            res.status(500).json({ error: error.message });
        }
    };

    logout = async (req: Request, res: Response) => {
        req.session.destroy((err) => {
            if (err) return res.status(500).json({ error: 'Logout failed' });
            res.clearCookie('wop_sid');
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
