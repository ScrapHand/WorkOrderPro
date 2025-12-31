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
        /https:\/\/.*\.vercel\.app$/ // Allow preview deployments
    ],
    credentials: true,
}));

// [ARCH] 4. Session with CHIPS (Partitioned Cookies)
// Implements the critical requirement for cross-site context.
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_secret_key_change_in_prod',
    resave: false,
    saveUninitialized: false,
    name: 'wop_session',
    cookie: {
        secure: true, // Requires HTTPS (or localhost with trust proxy? No, requires HTTPS mostly)
        httpOnly: true,
        sameSite: 'none', // Required for cross-site
        partitioned: true, // [CRITICAL] CHIPS opt-in
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    } as any // Cast verify TS definition supports 'partitioned' (it might not yet, but runtime accepts it)
}));

// [ARCH] 5. Tenant Context
app.use(tenantMiddleware);

// [ARCH] Deep Health Check (Prompt 3)
import 'dotenv/config'; // Ensure environment variables are loaded FIRST
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // In production, use a singleton service

app.get('/api/health', async (req, res) => {
    const health = {
        status: 'UP',
        checks: {
            database: 'UNKNOWN',
            s3: 'SKIPPED' // Mocking S3 for now
        },
        timestamp: new Date().toISOString()
    };

    // 1. Database Check
    try {
        await prisma.$queryRaw`SELECT 1`;
        health.checks.database = 'UP';
    } catch (error) {
        health.checks.database = 'DOWN';
        health.status = 'DOWN'; // Global status fails if DB fails
        console.error('Health Check DB Fail:', error);
    }

    const statusCode = health.status === 'UP' ? 200 : 503;
    res.status(statusCode).json(health);
});

// [ARCH] DI & Routes
import { PostgresAssetRepository } from './infrastructure/repositories/postgres-asset.repository';
import { AssetService } from './application/services/asset.service';
import { AssetController } from './infrastructure/http/controllers/asset.controller';

const assetRepo = new PostgresAssetRepository(prisma);
const assetService = new AssetService(assetRepo);
const assetController = new AssetController(assetService);

const assetRouter = express.Router();
assetRouter.post('/', assetController.create);
assetRouter.get('/:id/tree', assetController.getTree);

app.use('/api/assets', assetRouter);

// [ARCH] Work Order DI
import { PostgresWorkOrderRepository } from './infrastructure/repositories/work-order.repository';
import { RimeService } from './application/services/rime.service';
import { WorkOrderService } from './application/services/work-order.service';
import { WorkOrderController } from './infrastructure/http/controllers/work-order.controller';

const woRepo = new PostgresWorkOrderRepository(prisma);
const rimeService = new RimeService(assetRepo);
const woService = new WorkOrderService(woRepo, rimeService);
const woController = new WorkOrderController(woService);

const woRouter = express.Router();
woRouter.post('/', woController.create);
woRouter.get('/', woController.getAll);

app.use('/api/work-orders', woRouter);

// [ARCH] Upload DI
import { S3Service } from './infrastructure/services/s3.service';
import { UploadController } from './infrastructure/http/controllers/upload.controller';

const s3Service = new S3Service();
const uploadController = new UploadController(s3Service, prisma);

const uploadRouter = express.Router();
uploadRouter.post('/presign', uploadController.presign);
uploadRouter.post('/confirm', uploadController.createAttachment);

app.use('/api/upload', uploadRouter);

// [VERIFY] Auth Check
app.get('/api/auth/verify', (req, res) => {
    // If session exists, we are good.
    // In real auth, we'd check req.session.user
    const sessionID = req.sessionID;
    const hasSession = !!req.session;

    // For demo/phase 1, let's just create a session if asked
    if (req.query.login === 'true') {
        (req.session as any).user = { id: 'admin', role: 'admin' };
    }

    res.json({
        message: 'Auth Verification',
        sessionID,
        hasSession,
        user: (req.session as any).user || null,
        tenant: getCurrentTenant(), // Verify Middleware works
        cookies: req.cookies,
        headers: {
            'x-forwarded-proto': req.headers['x-forwarded-proto'],
            'origin': req.headers['origin']
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
