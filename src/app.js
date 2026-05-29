const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const logger = require('./config/logger');
const prisma = require('./config/prisma');
const { getRedisClient, checkRedisConfigured } = require('./config/redis');
const errorHandler = require('./middlewares/errorHandler');
const requestId = require('./middlewares/requestId');
const AppError = require('./utils/AppError');

const authRoutes = require('./modules/auth/auth.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();

// 1. Correlation ID tracking context must run first
app.use(requestId);

// 2. Logging middleware integration (using custom request ID generation)
app.use(pinoHttp({
    logger,
    genReqId: (req) => req.id,
}));

// Middlewares
app.use(cors({ origin: true, credentials: true })); // Configure this as needed
app.use(express.json());
app.use(cookieParser());

// --- Health and Readiness Endpoints ---

// GET /health - Basic server uptime status
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
    });
});

// GET /ready - Infrastructure connectivity verification
app.get('/ready', async (req, res) => {
    let isReady = true;
    let databaseStatus = 'disconnected';
    let redisStatus = 'disabled';

    // Check DB
    try {
        await prisma.$queryRaw`SELECT 1`;
        databaseStatus = 'connected';
    } catch (error) {
        databaseStatus = 'disconnected';
        isReady = false;
        logger.error({ err: error }, 'Readiness check: Database connection query failed');
    }

    // Check Redis (if configured)
    if (checkRedisConfigured()) {
        const redisClient = getRedisClient();
        if (redisClient && redisClient.isOpen) {
            redisStatus = 'connected';
        } else {
            redisStatus = 'disconnected';
            isReady = false;
            logger.error('Readiness check: Redis connectivity failed');
        }
    }

    const payload = {
        status: isReady ? 'ready' : 'unavailable',
        database: databaseStatus,
        redis: redisStatus,
    };

    if (isReady) {
        res.status(200).json(payload);
    } else {
        res.status(503).json(payload);
    }
});

// --- Application Routes ---
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Unhandled Route Fallback
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
