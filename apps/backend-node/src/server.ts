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
import { requirePermission, requireRole, UserRole } from './infrastructure/middleware/rbac.middleware';
import rateLimit from 'express-rate-limit';

// Infrastructure & DB
import { prisma } from './infrastructure/database/prisma';
import pgSession from 'connect-pg-simple';

// Repositories
import { PostgresAssetRepository } from './infrastructure/repositories/postgres-asset.repository';
import { PostgresWorkOrderRepository } from './infrastructure/repositories/work-order.repository';
import { PostgresRoleRepository } from './infrastructure/repositories/postgres-role.repository';
import { PostgresWorkOrderSessionRepository } from './infrastructure/repositories/postgres-work-order-session.repository';

// Services
import { AssetService } from './application/services/asset.service';
import { AssetImporterService } from './application/services/asset-importer.service';
import { RimeService } from './application/services/rime.service';
import { WorkOrderService } from './application/services/work-order.service';
import { S3Service } from './infrastructure/services/s3.service';
import { UserService } from './application/services/user.service';
import { ReportService } from './application/services/report.service';
import { RoleService } from './application/services/role.service';
import { WorkOrderSessionService } from './application/services/work-order-session.service';
import { AuditService } from './application/services/audit.service';
import { PartService } from './application/services/part.service';
import { PMService } from './application/services/pm.service';
import { ChecklistTemplateService } from './application/services/checklist-template.service';
import { TenantService } from './application/services/tenant.service';
import { AnalyticsService } from './application/services/analytics.service';
import { ProductionLineService } from './application/services/production-line.service';
import { FactoryLayoutService } from './application/services/factory-layout.service';
import { ConveyorSystemService } from './application/services/conveyor-system.service';

// Controllers
import { AssetController } from './infrastructure/http/controllers/asset.controller';
import { WorkOrderController } from './infrastructure/http/controllers/work-order.controller';
import { UploadController } from './infrastructure/http/controllers/upload.controller';
import { UserController } from './infrastructure/http/controllers/user.controller';
import { PartController } from './infrastructure/http/controllers/part.controller';
import { PMController } from './infrastructure/http/controllers/pm.controller';
import { AdminController } from './infrastructure/http/controllers/admin.controller';
import { DebugController } from './infrastructure/http/controllers/debug.controller';
import { ReportController } from './infrastructure/http/controllers/report.controller';
import { RoleController } from './infrastructure/http/controllers/role.controller';
import { WorkOrderSessionController } from './infrastructure/http/controllers/work-order-session.controller';
import { AuthController } from './infrastructure/http/controllers/auth.controller';
import { PlatformAdminController } from './infrastructure/http/controllers/platform-admin.controller';
import { TenantController } from './infrastructure/http/controllers/tenant.controller';
import { AnalyticsController } from './infrastructure/http/controllers/analytics.controller';
import { ProductionLineController } from './infrastructure/http/controllers/production-line.controller';
import { FactoryLayoutController } from './infrastructure/http/controllers/factory-layout.controller';
import { ConveyorSystemController } from './infrastructure/http/controllers/conveyor-system.controller';

const app = express();
const PORT = process.env.PORT || 8080;

app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
}));
app.use(cookieParser());
app.use(express.json());

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts, please try again later.' }
});

app.use('/api', generalLimiter);
app.use('/api/v1/auth/login', authLimiter);

// Session Persistence
const PgStore = pgSession(session);
app.use(session({
    store: new PgStore({
        conObject: {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        },
        createTableIfMissing: true,
        errorLog: console.error
    }),
    secret: process.env.SESSION_SECRET || 'dev_secret_key_change_in_prod',
    resave: false,
    saveUninitialized: false,
    name: 'wop_sid',
    rolling: true,
    proxy: true,
    cookie: {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        partitioned: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
    } as any
}));

app.use(tenantMiddleware);

// Request Logging
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

// Instantiate Services & Controllers
const assetRepo = new PostgresAssetRepository(prisma);
const assetService = new AssetService(assetRepo);
const assetImporterService = new AssetImporterService(prisma, assetService);
const assetController = new AssetController(assetService, assetImporterService, prisma);

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

const partService = new PartService(prisma);
const partController = new PartController(partService, prisma);

const templateService = new ChecklistTemplateService(prisma);
const pmService = new PMService(prisma, rimeService);
const pmController = new PMController(pmService, templateService);

const reportService = new ReportService(prisma);
const reportController = new ReportController(reportService, prisma);

const roleRepo = new PostgresRoleRepository(prisma);
const roleService = new RoleService(roleRepo);
const roleController = new RoleController(roleService, prisma);

const sessionRepo = new PostgresWorkOrderSessionRepository(prisma);
const sessionService = new WorkOrderSessionService(sessionRepo, prisma);
const sessionController = new WorkOrderSessionController(sessionService);

const auditService = new AuditService(prisma);
const authController = new AuthController(userService, auditService);

const tenantService = new TenantService(prisma);
const tenantController = new TenantController(tenantService);

const platformAdminController = new PlatformAdminController(prisma);

const analyticsService = new AnalyticsService(prisma);
const analyticsController = new AnalyticsController(analyticsService);

const lineService = new ProductionLineService(prisma);
const lineController = new ProductionLineController(lineService);

const factoryLayoutService = new FactoryLayoutService(prisma);
const factoryLayoutController = new FactoryLayoutController(factoryLayoutService);

const conveyorSystemService = new ConveyorSystemService(prisma);
const conveyorSystemController = new ConveyorSystemController(conveyorSystemService);

// Define Routers
const apiRouter = express.Router();

// Auth Routes
const authRouter = express.Router();
authRouter.post('/login', authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authController.me);
apiRouter.use('/auth', authRouter);

// Asset Routes
const assetRouter = express.Router();
assetRouter.post('/', requirePermission('asset:write'), assetController.create);
assetRouter.post('/layout', requireAuth, assetController.saveLayout);
assetRouter.get('/', requirePermission('asset:read'), assetController.getAll);
assetRouter.get('/:id', requirePermission('asset:read'), assetController.getById);
assetRouter.get('/:id/tree', requirePermission('asset:read'), assetController.getTree);
assetRouter.post('/import-template', requirePermission('asset:write'), assetController.importTemplate);
assetRouter.post('/bulk-import', requirePermission('asset:write'), assetController.bulkImport);
assetRouter.patch('/:id', requirePermission('asset:write'), assetController.update);
assetRouter.delete('/:id', requirePermission('asset:delete'), assetController.delete);
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

// Tenant Admin Routes
const tenantAdminRouter = express.Router();
tenantAdminRouter.patch('/config', requireRole(['TENANT_ADMIN', 'GLOBAL_ADMIN', 'SUPER_ADMIN']), adminController.updateConfig);
tenantAdminRouter.get('/config', requireAuth, adminController.getConfig);
tenantAdminRouter.patch('/:id/entitlements', requireRole('SUPER_ADMIN'), adminController.updateEntitlements);
tenantAdminRouter.get('/', requireRole('SUPER_ADMIN'), tenantController.getAll);
tenantAdminRouter.post('/', requireRole('SUPER_ADMIN'), tenantController.create);
tenantAdminRouter.post('/:id/seed', requireRole('SUPER_ADMIN'), tenantController.seedDemo);
tenantAdminRouter.delete('/:id', requireRole('SUPER_ADMIN'), tenantController.delete);
tenantAdminRouter.get('/audit-logs', requireRole('SUPER_ADMIN'), platformAdminController.getAuditLogs);
tenantAdminRouter.get('/users/search', requireRole('SUPER_ADMIN'), platformAdminController.globalUserSearch);
apiRouter.use('/tenant', tenantAdminRouter);

// Work Order Routes
const woRouter = express.Router();
woRouter.get('/my-active', requireAuth, sessionController.myActive);
woRouter.get('/:workOrderId/sessions', requireAuth, sessionController.getSessions);
woRouter.post('/:workOrderId/session/start', requireAuth, sessionController.start);
woRouter.post('/:workOrderId/session/stop', requireAuth, sessionController.stop);
woRouter.post('/:workOrderId/pause', requireAuth, sessionController.pause);
woRouter.post('/:workOrderId/complete', requireAuth, sessionController.complete);
woRouter.post('/', requirePermission('work_order:write'), woController.create);
woRouter.get('/', requirePermission('work_order:read'), woController.getAll);
woRouter.get('/:id', requirePermission('work_order:read'), woController.getById);
woRouter.patch('/:id', requirePermission('work_order:write'), woController.patch);
woRouter.delete('/:id', requirePermission('work_order:delete'), woController.delete);
apiRouter.use('/work-orders', woRouter);

// Upload Routes
const uploadRouter = express.Router();
uploadRouter.post('/presign', requireAuth, uploadController.presign);
uploadRouter.post('/confirm', requireAuth, uploadController.createAttachment);
uploadRouter.put('/local-sink', requireAuth, uploadController.localSink);
uploadRouter.get('/local-sink', requireAuth, uploadController.localSink);
uploadRouter.get('/proxy', uploadController.proxy);
apiRouter.use('/upload', uploadRouter);

// Parts Routes
const partRouter = express.Router();
partRouter.post('/', requirePermission('inventory:write'), partController.create);
partRouter.get('/', requirePermission('inventory:read'), partController.getAll);
partRouter.patch('/:id', requirePermission('inventory:write'), partController.update);
partRouter.delete('/:id', requirePermission('inventory:delete'), partController.delete);
partRouter.get('/transactions', requirePermission('inventory:read'), partController.getTransactions);
apiRouter.use('/parts', partRouter);

// Report Routes
const reportRouter = express.Router();
reportRouter.get('/work-orders', requireAuth, reportController.getWorkOrderSummary);
reportRouter.get('/trends', requireAuth, reportController.getTrends);
reportRouter.get('/inventory', requireAuth, reportController.getInventorySnapshot);
reportRouter.get('/advanced', requireAuth, reportController.getAdvancedMetrics);
apiRouter.use('/reports', reportRouter);

// PM Routes
const pmRouter = express.Router();
pmRouter.post('/schedules', requireAuth, pmController.createSchedule);
pmRouter.get('/schedules', requireAuth, pmController.getSchedules);
pmRouter.post('/schedules/:id/trigger', requireAuth, pmController.triggerSchedule);
pmRouter.post('/templates', requireAuth, pmController.createTemplate);
pmRouter.get('/templates', requireAuth, pmController.getTemplates);
pmRouter.get('/checklists/:workOrderId', requireAuth, pmController.getWorkOrderChecklist);
pmRouter.post('/checklists/sign-off/:itemId', requireAuth, pmController.signOffItem);
pmRouter.post('/trigger', requireAuth, pmController.triggerPMs);
apiRouter.use('/pm', pmRouter);

// Debug Routes
const debugRouter = express.Router();
debugRouter.get('/tenant', debugController.getTenantStatus);
apiRouter.use('/debug', debugRouter);

// Analytics Routes
const analyticsRouter = express.Router();
analyticsRouter.get('/stats', analyticsController.getStats);
apiRouter.use('/analytics', analyticsRouter);

// Production Line Routes
const lineRouter = express.Router();
lineRouter.get('/', requireAuth, lineController.getAll);
lineRouter.post('/', requireAuth, lineController.create);
lineRouter.get('/:id', requireAuth, lineController.getById);
lineRouter.post('/:id/connections', requireAuth, lineController.addConnection);
lineRouter.get('/:id/analyze', requireAuth, lineController.analyze);
apiRouter.use('/production-lines', lineRouter);

// Factory Layout Routes
const factoryLayoutRouter = express.Router();
factoryLayoutRouter.get('/', requireAuth, factoryLayoutController.listLayouts);
factoryLayoutRouter.post('/', requireAuth, factoryLayoutController.createLayout);
factoryLayoutRouter.get('/:id', requireAuth, factoryLayoutController.getLayout);
factoryLayoutRouter.patch('/:id', requireAuth, factoryLayoutController.updateMetadata);
factoryLayoutRouter.put('/:id/graph', requireAuth, factoryLayoutController.bulkSaveGraph);
factoryLayoutRouter.post('/:id/lock', requireAuth, factoryLayoutController.toggleLock);
factoryLayoutRouter.delete('/:id', requireAuth, factoryLayoutController.deleteLayout);
apiRouter.use('/factory-layouts', factoryLayoutRouter);

// Conveyor System Routes
const conveyorSystemRouter = express.Router();
conveyorSystemRouter.get('/', requireAuth, conveyorSystemController.listSystems);
conveyorSystemRouter.post('/', requireAuth, conveyorSystemController.createSystem);
conveyorSystemRouter.get('/:id', requireAuth, conveyorSystemController.getSystem);
conveyorSystemRouter.patch('/:id', requireAuth, conveyorSystemController.updateSystem);
conveyorSystemRouter.delete('/:id', requireAuth, conveyorSystemController.deleteSystem);
apiRouter.use('/conveyor-systems', conveyorSystemRouter);

// Mount API
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

app.get('/health', (req, res) => res.send('OK'));

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Fatal Error]', err);
    if (res.headersSent) return next(err);
    const status = err.status || 500;
    res.status(status).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message || 'Internal Server Error',
        requestId: (req as any).id || 'N/A'
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
