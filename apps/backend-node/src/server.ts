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

const app = express();
const PORT = process.env.PORT || 8080;

// [ARCH] 1. Proxy Trust (Render Requirement)
// Crucial for X-Forwarded-Proto to work, enabling Secure cookies.
// '1' trusts the first hop (the Render Load Balancer)
// [ARCH] 1. Proxy Trust (Render Requirement)
// Trust loopback and link-local. For Render, we often need to trust the load balancer.
// parse '1' or true. true means trust everything (safe-ish behind Render's firewall)
app.set('trust proxy', true);

// [ARCH] 2. Security Middleware
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

// [DEBUG] Log Protocol and Headers for Auth Debugging
app.use((req, res, next) => {
    if (req.path.includes('/auth') || req.path.includes('/work-orders')) {
        console.log(`[Request] ${req.method} ${req.path}`);
        console.log(`   Secure: ${req.secure}`);
        console.log(`   Protocol: ${req.protocol}`);
        console.log(`   X-Forwarded-Proto: ${req.headers['x-forwarded-proto']}`);
        console.log(`   SessionID: ${req.sessionID}`);
    }
    next();
});

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
        createTableIfMissing: false, // [FIX] Managed by Prisma now to avoid IDX conflict
        errorLog: console.error // [PHASE 18] Log connection errors
    }),
    secret: process.env.SESSION_SECRET || 'dev_secret_key_change_in_prod',
    resave: false,
    saveUninitialized: false, // [OPTIONAL] Set to true if you want to track "Guest" sessions
    name: 'wop_sid', // [PHASE 22] Rename to clear legacy collisions
    proxy: true, // [CRITICAL] Trust the proxy for secure cookies
    cookie: {
        path: '/',
        secure: true,        // Production is always HTTPS (Vercel)
        httpOnly: true,
        sameSite: 'lax',     // [FIX] Proxied via Vercel Rewrites = First Party
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days
    } as any
}));

// [ARCH] 5. Tenant Context
// [ARCH] 5. Tenant Context
app.use(tenantMiddleware);

// [ARCH] Database Connection
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
import { PostgresInventoryRepository } from './infrastructure/repositories/postgres-inventory.repository';
import { InventoryService } from './application/services/inventory.service';
import { InventoryController } from './infrastructure/http/controllers/inventory.controller';
import { ReportService } from './application/services/report.service';
import { ReportController } from './infrastructure/http/controllers/report.controller';

import { PostgresRoleRepository } from './infrastructure/repositories/postgres-role.repository';
import { RoleService } from './application/services/role.service';
import { RoleController } from './infrastructure/http/controllers/role.controller';

import { PostgresWorkOrderSessionRepository } from './infrastructure/repositories/postgres-work-order-session.repository';
import { WorkOrderSessionService } from './application/services/work-order-session.service';
import { WorkOrderSessionController } from './infrastructure/http/controllers/work-order-session.controller';

import { AuthController } from './infrastructure/http/controllers/auth.controller'; // [FIX] Import Auth

// Instantiate Services
const assetRepo = new PostgresAssetRepository(prisma);
const assetService = new AssetService(assetRepo);
const assetController = new AssetController(assetService, prisma);

const woRepo = new PostgresWorkOrderRepository(prisma);
const rimeService = new RimeService(assetRepo);
const woService = new WorkOrderService(woRepo, rimeService);
const woController = new WorkOrderController(woService, prisma);

const s3Service = new S3Service();
const uploadController = new UploadController(s3Service, prisma);

const userService = new UserService(prisma);
const userController = new UserController(userService);
const adminController = new AdminController(prisma);
const debugController = new DebugController(prisma);

const inventoryRepo = new PostgresInventoryRepository(prisma);
const inventoryService = new InventoryService(inventoryRepo);
const inventoryController = new InventoryController(inventoryService, prisma);

const reportService = new ReportService(prisma);
const reportController = new ReportController(reportService, prisma);

const roleRepo = new PostgresRoleRepository(prisma);
const roleService = new RoleService(roleRepo);
const roleController = new RoleController(roleService, prisma);

const sessionRepo = new PostgresWorkOrderSessionRepository(prisma);
const sessionService = new WorkOrderSessionService(sessionRepo, prisma);
const sessionController = new WorkOrderSessionController(sessionService);

const authController = new AuthController(userService); // [PHASE 23] Real Auth

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
const adminRouter = express.Router();
adminRouter.patch('/config', adminController.updateConfig);
adminRouter.get('/config', adminController.getConfig);
apiRouter.use('/tenant', adminRouter);

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
woRouter.delete('/:id', woController.delete);

apiRouter.use('/work-orders', woRouter);

// Upload Routes
const uploadRouter = express.Router();
uploadRouter.post('/presign', uploadController.presign);
uploadRouter.post('/confirm', uploadController.createAttachment);
apiRouter.use('/upload', uploadRouter);

// Inventory Routes
const inventoryRouter = express.Router();
inventoryRouter.post('/', inventoryController.create);
inventoryRouter.get('/', inventoryController.list);
inventoryRouter.put('/:id', inventoryController.update);
inventoryRouter.delete('/:id', inventoryController.delete);
apiRouter.use('/inventory', inventoryRouter);

// Report Routes
const reportRouter = express.Router();
reportRouter.get('/work-orders', reportController.getWorkOrderSummary);
reportRouter.get('/inventory', reportController.getInventorySnapshot);
apiRouter.use('/reports', reportRouter);

// Debug Routes
const debugRouter = express.Router();
debugRouter.get('/tenant', debugController.getTenantStatus);
apiRouter.use('/debug', debugRouter);

// Mount API v1
app.use('/api/v1', apiRouter); // [FIX] Use v1 prefix
app.use('/api', apiRouter); // [FIX] Fallback for api/ (legacy)

// Health Check (Root)
app.get('/health', (req, res) => res.send('OK'));


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
