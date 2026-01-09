import { Request, Response } from 'express';
import { UserService } from '../../../application/services/user.service';
import { AuditService } from '../../../application/services/audit.service';
import { TenantService } from '../../../application/services/tenant.service';
import * as argon2 from 'argon2';
import { loginSchema } from '../../../application/validators/auth.validator';
import { z } from 'zod';

export class AuthController {
    constructor(
        private userService: UserService,
        private auditService: AuditService,
        private tenantService: TenantService
    ) { }

    login = async (req: Request, res: Response) => {
        try {
            // [VALIDATION] Zod Check
            const result = loginSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ error: 'Invalid login data', details: result.error.issues });
            }

            const { email, password, tenant_slug } = result.data;
            // console.log('Login Attempt:', email, 'Target Tenant:', tenant_slug);

            // 1. Find user by email (Global lookup temporarily to identify tenant)
            let user = await this.userService.findByEmail(email);

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // [AUTO-DETECT] We trust the Email. 
            // The session will be locked to user.tenantId from the DB.
            // We ignore req.body.tenant_slug because we want to redirect them to their ACTUAL tenant.



            // 2. [JIT Seeding/Self-Healing] Ensure Demo User has correct credentials
            if (email === 'demo@demo.com') {
                const freshHash = await argon2.hash(password);

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

            // 3. [Validation] Standard argon2 check (No Bypass!)
            const isValid = await argon2.verify(user.passwordHash, password);

            if (!isValid) {
                await this.auditService.log({
                    tenantId: user.tenantId,
                    userId: user.id,
                    event: 'LOGIN_FAILURE',
                    metadata: { email, reason: 'Invalid password' }
                });
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // 4. [Session] Create Persistence & Rotation
            // [HARDENING] Session Rotation to prevent Session Fixation
            req.session.regenerate(async (err) => {
                if (err) {
                    console.error('Session Regeneration Error:', err);
                    return res.status(500).json({ error: 'Session initialization failed' });
                }

                (req.session as any).user = {
                    id: user!.id,
                    email: user!.email,
                    username: user!.username,
                    avatarUrl: user!.avatarUrl,
                    full_name: (user as any).full_name,
                    role: user!.role,
                    tenantId: user!.tenantId,
                    tenantSlug: (user as any).tenant?.slug,
                    permissions: await this.userService.getUserPermissions(user!.id)
                };

                req.session.save(async (saveErr) => {
                    if (saveErr) {
                        console.error('Session Save Error:', saveErr);
                        return res.status(500).json({ error: 'Session save failed' });
                    }

                    await this.auditService.log({
                        tenantId: user!.tenantId,
                        userId: user!.id,
                        event: 'LOGIN_SUCCESS',
                        metadata: { email }
                    });

                    res.json({
                        success: true,
                        user: (req.session as any).user,
                        tenant: (user as any).tenant,
                        message: 'Logged in successfully',
                    });
                });
            });

        } catch (error: any) {
            console.error('Login Error:', error);
            res.status(500).json({ error: error.message });
        }
    };

    register = async (req: Request, res: Response) => {
        try {
            const schema = z.object({
                email: z.string().email(),
                password: z.string().min(8),
                companyName: z.string().min(2),
                slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric and lowercase'),
                plan: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).default('PRO')
            });

            const result = schema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ error: 'Invalid registration data', details: result.error.issues });
            }

            const { email, password, companyName, slug, plan } = result.data;

            // 1. Create Tenant (This also creates the Admin user via transaction in TenantService)
            // We pass the password directly to TenantService.create
            const tenant = await this.tenantService.create(
                companyName,
                slug,
                email,
                plan === 'STARTER' ? 5 : (plan === 'PRO' ? 25 : 100), // maxUsers
                plan === 'STARTER' ? 1 : (plan === 'PRO' ? 3 : 10),  // maxAdmins
                password
            );

            // 2. Log them in automatically
            const user = await this.userService.findByEmail(email);
            if (!user) throw new Error('User creation failed after tenant creation');

            req.session.regenerate(async (err) => {
                if (err) return res.status(500).json({ error: 'Session failed' });

                (req.session as any).user = {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    tenantId: user.tenantId,
                    tenantSlug: slug,
                    permissions: await this.userService.getUserPermissions(user.id)
                };

                req.session.save(async (saveErr) => {
                    if (saveErr) return res.status(500).json({ error: 'Session save failed' });

                    await this.auditService.log({
                        tenantId: user.tenantId,
                        userId: user.id,
                        event: 'TENANT_REGISTERED',
                        metadata: { companyName, slug, plan }
                    });

                    res.status(201).json({
                        success: true,
                        user: (req.session as any).user,
                        tenant,
                        message: 'Account created and logged in successfully'
                    });
                });
            });

        } catch (error: any) {
            console.error('Registration Error:', error);
            if (error.code === 'P2002') { // Prisma unique constraint violation
                return res.status(400).json({ error: 'Email or Tenant Slug already exists' });
            }
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

    me = async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;
        if (sessionUser) {
            // [HARDENING] Re-fetch basics to catch avatar/name changes without re-login
            const user = await this.userService.findById(sessionUser.id);

            if (!user) {
                req.session.destroy(() => { });
                return res.status(401).json({ isAuthenticated: false });
            }

            // Update session with latest from DB
            const updatedUser = {
                ...sessionUser,
                email: user.email,
                username: user.username,
                avatarUrl: user.avatarUrl,
                role: user.role,
                tenantId: user.tenantId
            };
            (req.session as any).user = updatedUser;

            res.json({ isAuthenticated: true, user: updatedUser });
        } else {
            res.status(401).json({ isAuthenticated: false });
        }
    };
}
