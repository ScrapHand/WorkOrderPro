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

app.set('trust proxy', 1); // [FIX] PaaS providers (Render/Vercel) use load balancers. 1 = trust first hop.

// [ARCH] 2. Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false, // [FIX] Required for some cross-origin image loads
}));
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
    rolling: true, // [NEW] Reset maxAge on every response to keep active users logged in
    proxy: true, // [CRITICAL] Trust the proxy for secure cookies
    cookie: {
        path: '/',
        httpOnly: true, // Mitigate XSS
        secure: process.env.NODE_ENV === 'production', // [FIX] HTTPS only in prod
        // 'none' required for cross-site (backend != frontend domain).
        // 'lax' is safer for same-domain deployments.
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        // CHIPS Support: Partition cookie by top-level site
        partitioned: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days persistence
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
assetRouter.post('/', requirePermission('asset:write'), assetController.create);
assetRouter.post('/layout', requireAuth, assetController.saveLayout); // [NEW] Save Layout - Auth enough for user scope
assetRouter.get('/', requirePermission('asset:read'), assetController.getAll);
assetRouter.get('/:id/tree', requirePermission('asset:read'), assetController.getTree);
assetRouter.patch('/:id', requirePermission('asset:write'), assetController.update);
apiRouter.use('/assets', assetRouter);

// User Routes
const userRouter = express.Router();
userRouter.post('/', requirePermission('user:write'), userController.create);
userRouter.get('/', requirePermission('user:read'), userController.getAll);
userRouter.patch('/:id', requirePermission('user:write'), userController.update);
userRouter.delete('/:id', requirePermission('user:delete'), userController.delete);
apiRouter.use('/users', userRouter);

// Role Routes
const roleRouter = express.Router();
roleRouter.post('/', requirePermission('role:write'), roleController.create);
roleRouter.get('/', requirePermission('role:read'), roleController.getAll);
roleRouter.patch('/:id', requirePermission('role:write'), roleController.update);
roleRouter.delete('/:id', requirePermission('role:delete'), roleController.delete);
roleRouter.get('/:id', requirePermission('role:read'), roleController.getById);
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
woRouter.post('/', requirePermission('work_order:write'), woController.create);
woRouter.get('/', requirePermission('work_order:read'), woController.getAll);
woRouter.get('/:id', requirePermission('work_order:read'), woController.getById); // Catch-all ID route last
woRouter.patch('/:id', requirePermission('work_order:write'), woController.patch);
woRouter.delete('/:id', requirePermission('work_order:delete'), woController.delete);

apiRouter.use('/work-orders', woRouter);

// Upload Routes
const uploadRouter = express.Router();
uploadRouter.post('/presign', requireAuth, uploadController.presign);
uploadRouter.post('/confirm', requireAuth, uploadController.createAttachment);
uploadRouter.put('/local-sink', requireAuth, uploadController.localSink); // [DEV] Local Upload
uploadRouter.get('/local-sink', requireAuth, uploadController.localSink); // [DEV] Local Download
uploadRouter.get('/proxy', uploadController.proxy); // [NEW] S3 Proxy - Public with internal resolution
apiRouter.use('/upload', uploadRouter);

// Inventory/Parts Module
import { PartService } from './application/services/part.service';
import { PartController } from './infrastructure/http/controllers/part.controller';

const partService = new PartService(prisma);
const partController = new PartController(partService, prisma);

const partRouter = express.Router();
partRouter.post('/', requirePermission('inventory:write'), partController.create);
partRouter.get('/', requirePermission('inventory:read'), partController.getAll);
partRouter.patch('/:id', requirePermission('inventory:write'), partController.update);
partRouter.delete('/:id', requirePermission('inventory:delete'), partController.delete);
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
