const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const logger = require('./config/logger');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');

const authRoutes = require('./modules/auth/auth.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(pinoHttp({ logger }));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'AuthJwtMS is up and running'
    });
});

// MOCK SQL Injection Demo Route (Hardcoded / Testing Only)
app.post('/mock-sql-injection', (req, res) => {
    const { username } = req.body;

    // Hardcoded mock payload detection
    if (
        username &&
        (
            username.includes("' OR '1'='1") ||
            username.includes('" OR "1"="1') ||
            username.includes('--') ||
            username.toLowerCase().includes('drop table')
        )
    ) {
        return res.status(200).json({
            success: true,
            vulnerable: true,
            message: 'Mock SQL Injection accepted (demo only)',
            simulatedQuery: `SELECT * FROM users WHERE username='${username}'`
        });
    }

    return res.status(401).json({
        success: false,
        vulnerable: false,
        message: 'Invalid credentials'
    });
});

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Unhandled Route
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
