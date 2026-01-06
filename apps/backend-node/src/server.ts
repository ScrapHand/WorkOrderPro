import 'dotenv/config'; // [PHASE 18] Load Env Vars FIRST
if (!process.env.DATABASE_URL) {
    throw new Error('FATAL: DATABASE_URL is missing on startup.');
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { tenantMiddleware, getCurrentTenant } from './infrastructure/middleware/tenant.middleware';
import { requireAuth } from './infrastructure/middleware/auth.middleware';
import { requirePermission, requireRole } from './infrastructure/middleware/rbac.middleware';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 8080;

// [ARCH] 1. Proxy Trust (Render Requirement)
// Crucial for X-Forwarded-Proto to work, enabling Secure cookies.
// '1' trusts the first hop (the Render Load Balancer)
// [ARCH] 1. Proxy Trust (Render Requirement)
// Trust loopback and link-local. For Render, we often need to trust the load balancer.
// parse '1' or true. true means trust everything (safe-ish behind Render's firewall)
app.set('trust proxy', process.env.NODE_ENV === 'production');

// [ARCH] 2. Security Middleware
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

// [HARDENING] 2.1 General Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 attempts per 15 mins
    message: { error: 'Too many login attempts, please try again later.' }
});

app.use('/api', generalLimiter);
app.use('/api/v1/auth/login', authLimiter);

// [DEBUG] Log Protocol and Headers moved after session

// [ARCH] 3. CORS & Auth
// Must allow credentials for cross-site cookies.
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'https://workorderpro.vercel.app',
        'https://work-order-pro.vercel.app', // [FIX] New Prod URL
        ...(process.env.BACKEND_CORS_ORIGINS ? process.env.BACKEND_CORS_ORIGINS.split(',') : []),
        /https:\/\/.*\.vercel\.app$/ // Allow preview deployments
    ],
    credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable Pre-Flight with same config

// [ARCH] 4. Session Persistence (Postgres)
// Replaces MemoryStore to survive Render restarts/re-deploys.
import pgSession from 'connect-pg-simple';
const PgStore = pgSession(session);

app.use(session({
    store: new PgStore({
        conObject: {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false } // Render requires SSL
        },
        createTableIfMissing: true, // [FIX] Ensure table exists for dev consistency
        errorLog: console.error // [PHASE 18] Log connection errors
    }),
    secret: process.env.SESSION_SECRET || 'dev_secret_key_change_in_prod',
    resave: false,
    saveUninitialized: false, // [OPTIONAL] Set to true if you want to track "Guest" sessions
    name: 'wop_sid', // [PHASE 22] Rename to clear legacy collisions
    proxy: true, // [CRITICAL] Trust the proxy for secure cookies
    cookie: {
        path: '/',
        secure: process.env.NODE_ENV === 'production', // [FIX] HTTPS only in prod
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // [FIX] 'none' for cross-site (frontend domain != backend domain in prod), 'lax' for local
        partitioned: process.env.NODE_ENV === 'production', // [NEW] CHIPS support for cross-site iframes
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days
    } as any
}));

// [ARCH] 5. Tenant Context
app.use(tenantMiddleware);

// [DEBUG] Log Protocol and Headers for Auth Debugging - POST SESSION
app.use((req, res, next) => {
    if (req.path.includes('/api/v1')) {
        const sessionUser = (req.session as any)?.user;
        console.log(`[Request] ${req.method} ${req.path}`);
        console.log(`   SessionID: ${req.sessionID}`);
        console.log(`   User: ${sessionUser?.email || 'GUEST'} (${sessionUser?.role || 'N/A'})`);
        console.log(`   Tenant: ${getCurrentTenant()?.slug || 'NONE'}`);
    }
    next();
});

// [ARCH] Database Connection
import { prisma } from './infrastructure/database/prisma';

// [ARCH] DI & Routes
// Import Controllers
import { PostgresAssetRepository } from './infrastructure/repositories/postgres-asset.repository';
import { AssetService } from './application/services/asset.service';
import { AssetController } from './infrastructure/http/controllers/asset.controller';

import { PostgresWorkOrderRepository } from './infrastructure/repositories/work-order.repository';
import { RimeService } from './application/services/rime.service';
import { WorkOrderService } from './application/services/work-order.service';
import { WorkOrderController } from './infrastructure/http/controllers/work-order.controller';

import { S3Service } from './infrastructure/services/s3.service';
import { UploadController } from './infrastructure/http/controllers/upload.controller';

import { UserService } from './application/services/user.service';
import { UserController } from './infrastructure/http/controllers/user.controller';
import { AdminController } from './infrastructure/http/controllers/admin.controller';
import { DebugController } from './infrastructure/http/controllers/debug.controller';
import { ReportService } from './application/services/report.service';
import { ReportController } from './infrastructure/http/controllers/report.controller';

import { PostgresRoleRepository } from './infrastructure/repositories/postgres-role.repository';
import { RoleService } from './application/services/role.service';
import { RoleController } from './infrastructure/http/controllers/role.controller';

import { PostgresWorkOrderSessionRepository } from './infrastructure/repositories/postgres-work-order-session.repository';
import { WorkOrderSessionService } from './application/services/work-order-session.service';
import { WorkOrderSessionController } from './infrastructure/http/controllers/work-order-session.controller';

import { AuthController } from './infrastructure/http/controllers/auth.controller';
import { PlatformAdminController } from './infrastructure/http/controllers/platform-admin.controller';
import { AuditService } from './application/services/audit.service';

// Instantiate Services
const assetRepo = new PostgresAssetRepository(prisma);
const assetService = new AssetService(assetRepo);
const assetController = new AssetController(assetService, prisma);

const woRepo = new PostgresWorkOrderRepository(prisma);
const rimeService = new RimeService(assetRepo);
const woService = new WorkOrderService(woRepo, rimeService);
const woController = new WorkOrderController(woService, prisma);

const s3Service = new S3Service();
s3Service.ensureBucketExists().catch(err => console.error('[S3] Bootstrap Error:', err));
const uploadController = new UploadController(s3Service, prisma);

const userService = new UserService(prisma);
const userController = new UserController(userService);
const adminController = new AdminController(prisma);
const debugController = new DebugController(prisma);

// Inventory Module (Temporarily Disabled for Refactor)
// const inventoryRepo = new PostgresInventoryRepository(prisma);
// const inventoryService = new InventoryService(inventoryRepo);
// const inventoryController = new InventoryController(inventoryService, prisma);

const reportService = new ReportService(prisma);
const reportController = new ReportController(reportService, prisma);

const roleRepo = new PostgresRoleRepository(prisma);
const roleService = new RoleService(roleRepo);
const roleController = new RoleController(roleService, prisma);

const sessionRepo = new PostgresWorkOrderSessionRepository(prisma);
const sessionService = new WorkOrderSessionService(sessionRepo, prisma);
const sessionController = new WorkOrderSessionController(sessionService);

const auditService = new AuditService(prisma);
const authController = new AuthController(userService, auditService); // [PHASE 23] Real Auth

const platformAdminController = new PlatformAdminController(prisma);

// Define Routers
const apiRouter = express.Router(); // [FIX] Group under /api/v1

// Auth Routes
const authRouter = express.Router();
authRouter.post('/login', authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authController.me);
authRouter.get('/verify', (req, res) => {
    res.json({
        message: 'Auth Verification',
        sessionID: req.sessionID,
        user: (req.session as any).user || null,
        tenant: getCurrentTenant(),
        headers: req.headers
    });
});
apiRouter.use('/auth', authRouter);

// Asset Routes
const assetRouter = express.Router();
assetRouter.post('/', assetController.create);
assetRouter.post('/layout', assetController.saveLayout); // [NEW] Save Layout
assetRouter.get('/', assetController.getAll); // [FIX] Restore Helper
assetRouter.get('/:id/tree', assetController.getTree);
assetRouter.patch('/:id', assetController.update); // [FIX] Add Update Route
apiRouter.use('/assets', assetRouter);

// User Routes
const userRouter = express.Router();
userRouter.post('/', userController.create); // Create User
userRouter.get('/', userController.getAll); // List Users
userRouter.patch('/:id', userController.update);
userRouter.delete('/:id', userController.delete);
apiRouter.use('/users', userRouter);

// Role Routes
const roleRouter = express.Router();
roleRouter.post('/', roleController.create);
roleRouter.get('/', roleController.getAll);
roleRouter.patch('/:id', roleController.update);
roleRouter.delete('/:id', roleController.delete);
roleRouter.get('/:id', roleController.getById);
apiRouter.use('/roles', roleRouter);

// Admin Routes (Tenants)
import { TenantService } from './application/services/tenant.service';
import { TenantController } from './infrastructure/http/controllers/tenant.controller';

const tenantService = new TenantService(prisma);
const tenantController = new TenantController(tenantService);

const adminRouter = express.Router();
adminRouter.patch('/config', adminController.updateConfig);
adminRouter.get('/config', adminController.getConfig);

// [NEW] Tenant Management Routes - Restricted to Super Admin
adminRouter.get('/', requireRole('SUPER_ADMIN'), tenantController.getAll);
adminRouter.post('/', requireRole('SUPER_ADMIN'), tenantController.create);
adminRouter.post('/:id/seed', requireRole('SUPER_ADMIN'), tenantController.seedDemo);
adminRouter.delete('/:id', requireRole('SUPER_ADMIN'), tenantController.delete); // [NEW] Delete Tenant

// [NEW] Platform-Wide Admin Routes
adminRouter.get('/audit-logs', requireRole('SUPER_ADMIN'), platformAdminController.getAuditLogs);
adminRouter.get('/users/search', requireRole('SUPER_ADMIN'), platformAdminController.globalUserSearch);

apiRouter.use('/tenant', adminRouter); // Note: mounted at /api/v1/tenant

// Work Order Routes
const woRouter = express.Router();

// Session Routes - Protected (Must be before /:id)
woRouter.get('/my-active', requireAuth, sessionController.myActive);
woRouter.get('/:workOrderId/sessions', requireAuth, sessionController.getSessions);
woRouter.post('/:workOrderId/session/start', requireAuth, sessionController.start);
woRouter.post('/:workOrderId/session/stop', requireAuth, sessionController.stop);
woRouter.post('/:workOrderId/pause', requireAuth, sessionController.pause);
woRouter.post('/:workOrderId/complete', requireAuth, sessionController.complete);

// General Routes
woRouter.post('/', woController.create);
woRouter.get('/', woController.getAll);
woRouter.get('/:id', woController.getById); // Catch-all ID route last
woRouter.patch('/:id', woController.patch);
woRouter.delete('/:id', woController.delete);

apiRouter.use('/work-orders', woRouter);

// Upload Routes
const uploadRouter = express.Router();
uploadRouter.post('/presign', uploadController.presign);
uploadRouter.post('/confirm', uploadController.createAttachment);
uploadRouter.put('/local-sink', uploadController.localSink); // [DEV] Local Upload
uploadRouter.get('/local-sink', uploadController.localSink); // [DEV] Local Download
uploadRouter.get('/proxy', uploadController.proxy); // [NEW] S3 Proxy
apiRouter.use('/upload', uploadRouter);

// Inventory/Parts Module
import { PartService } from './application/services/part.service';
import { PartController } from './infrastructure/http/controllers/part.controller';

const partService = new PartService(prisma);
const partController = new PartController(partService, prisma);

const partRouter = express.Router();
partRouter.post('/', partController.create);
partRouter.get('/', partController.getAll);
partRouter.patch('/:id', partController.update);
partRouter.delete('/:id', partController.delete);
apiRouter.use('/parts', partRouter);

// Report Routes
const reportRouter = express.Router();
reportRouter.get('/work-orders', reportController.getWorkOrderSummary);
reportRouter.get('/inventory', reportController.getInventorySnapshot);
apiRouter.use('/reports', reportRouter);

// Debug Routes
const debugRouter = express.Router();
debugRouter.get('/tenant', debugController.getTenantStatus);
apiRouter.use('/debug', debugRouter);

// Analytics Routes
import { AnalyticsService } from './application/services/analytics.service';
import { AnalyticsController } from './infrastructure/http/controllers/analytics.controller';

const analyticsService = new AnalyticsService(prisma);
const analyticsController = new AnalyticsController(analyticsService);

const analyticsRouter = express.Router();
analyticsRouter.get('/stats', analyticsController.getStats);
apiRouter.use('/analytics', analyticsRouter);

// Mount API v1
app.use('/api/v1', apiRouter); // [FIX] Use v1 prefix
app.use('/api', apiRouter); // [FIX] Fallback for api/ (legacy)

// Health Check (Root)
app.get('/health', (req, res) => res.send('OK'));

// [HARDENING] Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // 1. Log to console for backend debugging
    console.error('[Fatal Error]', err);

    // 2. Avoid double-sending if headers already sent
    if (res.headersSent) {
        return next(err);
    }

    const status = err.status || 500;

    // 3. Bulletproof Serialization
    // Native Errors don't stringify well, we extract key info
    const errorResponse = {
        error: process.env.NODE_ENV === 'production'
            ? 'Internal Server Error'
            : err.message || 'Internal Server Error',
        requestId: (req as any).id || 'N/A',
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        details: process.env.NODE_ENV === 'production' ? undefined : {
            code: err.code,
            meta: err.meta,
            clientVersion: err.clientVersion
        }
    };

    res.status(status).json(errorResponse);
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
