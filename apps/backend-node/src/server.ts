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
app.set('trust proxy', 1);

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
        'https://work-order-1tsb23zwd-scraphands-projects.vercel.app', // [FIX] Explicit deployment URL
        /https:\/\/.*\.vercel\.app$/ // Allow preview deployments
    ],
    credentials: true,
}));

// ... (Middlewares) ...
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_secret_key_change_in_prod',
    resave: false,
    saveUninitialized: false,
    name: 'wop_session',
    cookie: {
        secure: process.env.NODE_ENV === 'production', // [FIX] Secure in prod
        httpOnly: true,
        sameSite: 'none', // Required for cross-site
        partitioned: true, // [CRITICAL] CHIPS opt-in
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    } as any
}));

// [ARCH] 5. Tenant Context
// [ARCH] 5. Tenant Context
app.use(tenantMiddleware);

// [ARCH] Database Connection
import 'dotenv/config';
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

const authController = new AuthController(); // [FIX] Instantiate Auth

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
assetRouter.get('/:id/tree', assetController.getTree);
apiRouter.use('/assets', assetRouter);

// User Routes
const userRouter = express.Router();
userRouter.post('/', userController.create); // Create User
userRouter.get('/', userController.getAll); // List Users
apiRouter.use('/users', userRouter);

// Admin Routes (Tenants)
const adminRouter = express.Router();
adminRouter.patch('/branding', adminController.updateBranding);
apiRouter.use('/tenant', adminRouter);

// Work Order Routes
const woRouter = express.Router();
woRouter.post('/', woController.create);
woRouter.get('/', woController.getAll);
apiRouter.use('/work-orders', woRouter);

// Upload Routes
const uploadRouter = express.Router();
uploadRouter.post('/presign', uploadController.presign);
uploadRouter.post('/confirm', uploadController.createAttachment);
apiRouter.use('/upload', uploadRouter);

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
