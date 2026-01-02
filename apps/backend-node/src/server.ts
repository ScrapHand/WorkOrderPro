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

const app = express();
const PORT = process.env.PORT || 8080;

// [ARCH] 1. Proxy Trust (Render Requirement)
// Crucial for X-Forwarded-Proto to work, enabling Secure cookies.
// '1' trusts the first hop (the Render Load Balancer)
app.set('trust proxy', process.env.TRUST_PROXY || 1); // [PHASE 22] Calibrate to Render Standard

// [ARCH] 2. Security Middleware
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

// [ARCH] 3. CORS & Auth
// Must allow credentials for cross-site cookies.
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://workorderpro.vercel.app',
        'https://work-order-pro.vercel.app', // [FIX] New Prod URL
        ...(process.env.BACKEND_CORS_ORIGINS ? process.env.BACKEND_CORS_ORIGINS.split(',') : []),
        /https:\/\/.*\.vercel\.app$/ // Allow preview deployments
    ],
    credentials: true,
}));

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
        secure: true,        // [PHASE 21] Standard HTTPS
        httpOnly: true,
        sameSite: 'none',     // [PHASE 21] Cross-Site for Vercel
        partitioned: true,   // [PHASE 21] Chrome CHIPS Compliance
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days (Persistent)
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
woRouter.post('/', woController.create);
woRouter.get('/', woController.getAll);
woRouter.get('/:id', woController.getById);
woRouter.delete('/:id', woController.delete);

// Session Routes
woRouter.post('/:workOrderId/session/start', sessionController.start);
woRouter.post('/:workOrderId/session/stop', sessionController.stop);
woRouter.post('/:workOrderId/pause', sessionController.pause);
woRouter.post('/:workOrderId/complete', sessionController.complete);
woRouter.get('/:workOrderId/sessions', sessionController.getSessions);
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
