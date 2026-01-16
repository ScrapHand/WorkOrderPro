import { Request, Response } from 'express';
import { UserService } from '../../../application/services/user.service';
import { AuditService } from '../../../application/services/audit.service';
import { TenantService } from '../../../application/services/tenant.service';
import * as argon2 from 'argon2';
import { loginSchema } from '../../../application/validators/auth.validator';
import { z } from 'zod';
import { logger } from '../../logging/logger';

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

            const { email, password } = result.data;
            logger.info({ email }, 'Login attempt');

            // 1. Find user by email (Global lookup temporarily to identify tenant)
            let user = await this.userService.findByEmail(email);

            if (!user) {
                logger.warn({ email }, 'Login failed: User not found');
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // 2. [JIT Seeding/Self-Healing] Ensure Demo User has correct credentials
            if (email === 'demo@demo.com') {
                const freshHash = await argon2.hash(password);

                if (!user) {
                    logger.info('Creating Demo User');
                    user = await this.userService.createUser(
                        'default',
                        email,
                        'SYSTEM_ADMIN',
                        password
                    );
                } else {
                    logger.info('Healing Demo User Credentials');
                    user = await this.userService.updateUserPassword(user.id, freshHash);
                }
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // 3. [Validation] Standard argon2 check
            const isValid = await argon2.verify(user.passwordHash, password);

            if (!isValid) {
                logger.warn({ email, tenantId: user.tenantId }, 'Login failed: Invalid password');
                await this.auditService.log({
                    tenantId: user.tenantId,
                    userId: user.id,
                    event: 'LOGIN_FAILURE',
                    metadata: { email, reason: 'Invalid password' }
                });
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // 4. [Session] Create Persistence & Rotation
            req.session.regenerate(async (err) => {
                if (err) {
                    logger.error({ error: err, email }, 'Session regeneration failed during login');
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
                        logger.error({ error: saveErr, email }, 'Session save failed during login');
                        return res.status(500).json({ error: 'Session save failed' });
                    }

                    await this.auditService.log({
                        tenantId: user!.tenantId,
                        userId: user!.id,
                        event: 'LOGIN_SUCCESS',
                        metadata: { email }
                    });

                    logger.info({ email, tenantId: user!.tenantId }, 'Login successful');

                    res.json({
                        success: true,
                        user: (req.session as any).user,
                        tenant: (user as any).tenant,
                        message: 'Logged in successfully',
                    });
                });
            });

        } catch (error: any) {
            logger.error({ error }, 'Login error');
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
            logger.info({ email, slug, plan }, 'Registration requested');

            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            const tenant = await this.tenantService.create(
                companyName,
                slug,
                email,
                plan === 'STARTER' ? 5 : (plan === 'PRO' ? 25 : 100),
                plan === 'STARTER' ? 1 : (plan === 'PRO' ? 3 : 10),
                password,
                verificationCode
            );

            logger.info({ email, tenantId: tenant.id }, 'Tenant and Admin user created');

            const user = await this.userService.findByEmail(email);
            if (!user) throw new Error('User creation failed after tenant creation');

            req.session.regenerate(async (err) => {
                if (err) {
                    logger.error({ error: err, email }, 'Session regeneration failed during registration');
                    return res.status(500).json({ error: 'Session failed' });
                }

                (req.session as any).user = {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    tenantId: user.tenantId,
                    tenantSlug: slug,
                    emailVerified: false,
                    permissions: await this.userService.getUserPermissions(user.id)
                };

                req.session.save(async (saveErr) => {
                    if (saveErr) {
                        logger.error({ error: saveErr, email }, 'Session save failed during registration');
                        return res.status(500).json({ error: 'Session save failed' });
                    }

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
                        message: 'Account created. Please verify your email.',
                        verificationRequired: true
                    });
                });
            });

        } catch (error: any) {
            logger.error({ error }, 'Registration error');
            if (error.code === 'P2002') {
                return res.status(400).json({ error: 'Email or Tenant Slug already exists' });
            }
            res.status(500).json({ error: error.message });
        }
    };

    logout = async (req: Request, res: Response) => {
        const userId = (req.session as any)?.user?.id;
        req.session.destroy((err) => {
            if (err) {
                logger.error({ error: err, userId }, 'Logout failed');
                return res.status(500).json({ error: 'Logout failed' });
            }
            logger.info({ userId }, 'Logout successful');
            res.clearCookie('wop_sid');
            res.json({ success: true, message: 'Logged out' });
        });
    };

    me = async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;
        if (sessionUser) {
            const user = await this.userService.findById(sessionUser.id);

            if (!user) {
                logger.warn({ userId: sessionUser.id }, 'Session user not found in DB, logging out');
                req.session.destroy(() => { });
                return res.status(401).json({ isAuthenticated: false });
            }

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

    verifyEmail = async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;
        try {
            const { code } = req.body;
            if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' });

            const user = await this.userService.findById(sessionUser.id) as any;
            if (!user) return res.status(404).json({ error: 'User not found' });

            if (user.verificationCode !== code) {
                logger.warn({ userId: user.id, email: user.email }, 'Invalid email verification code');
                return res.status(400).json({ error: 'Invalid verification code' });
            }

            await this.userService.updateUser(user.id, {
                emailVerified: new Date(),
                verificationCode: null
            } as any);

            (req.session as any).user.emailVerified = true;
            req.session.save();

            await this.auditService.log({
                tenantId: user.tenantId,
                userId: user.id,
                event: 'EMAIL_VERIFIED',
                metadata: { email: user.email }
            });

            logger.info({ userId: user.id, email: user.email }, 'Email verified successfully');
            res.json({ success: true, message: 'Email verified successfully' });
        } catch (error: any) {
            logger.error({ error, userId: sessionUser?.id }, 'Email verification failed');
            res.status(500).json({ error: error.message });
        }
    };
}
