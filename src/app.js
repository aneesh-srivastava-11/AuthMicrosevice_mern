const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const logger = require('./config/logger');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');

const authRoutes = require('./modules/auth/auth.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();// MOCK SQLi Demo
app.post('/mock-sqli', (req, res) => {
    const { username } = req.body;

    const simulatedQuery =
        `SELECT * FROM users WHERE username='${username}'`;

    if (
        username &&
        (
            username.includes("' OR '1'='1") ||
            username.includes('--') ||
            username.toLowerCase().includes('drop table')
        )
    ) {
        return res.json({
            alert: 'SQL Injection Detected (Mock)',
            vulnerable: true,
            simulatedQuery
        });
    }

    res.json({
        vulnerable: false,
        simulatedQuery
    });
});

// MOCK XSS Demo
app.post('/mock-xss', (req, res) => {
    const { comment } = req.body;

    if (
        comment &&
        (
            comment.includes('<script>') ||
            comment.includes('onerror=') ||
            comment.includes('javascript:')
        )
    ) {
        return res.json({
            alert: 'XSS Payload Detected (Mock)',
            vulnerable: true,
            payload: comment
        });
    }

    res.json({
        vulnerable: false
    });
});

// MOCK Broken Auth Demo
app.post('/mock-auth-bypass', (req, res) => {
    const { username, password } = req.body;

    if (
        username === 'admin' &&
        password === 'letmein123'
    ) {
        return res.json({
            alert: 'Mock Auth Bypass Triggered',
            access: 'admin'
        });
    }

    res.status(401).json({
        access: 'denied'
    });
});

// MOCK Sensitive Data Exposure
app.get('/mock-secret-leak', (req, res) => {
    res.json({
        warning: 'Sensitive data exposure (Mock)',
        apiKey: 'MOCK-API-12345',
        jwtSecret: 'demo-jwt-secret',
        dbPassword: 'password123'
    });
});

// MOCK Command Injection Detection
app.post('/mock-cmdi', (req, res) => {
    const { command } = req.body;

    if (
        command &&
        (
            command.includes(';') ||
            command.includes('&&') ||
            command.includes('|')
        )
    ) {
        return res.json({
            alert: 'Command Injection Pattern Detected (Mock)',
            vulnerable: true,
            simulatedExecution: command
        });
    }

    res.json({
        vulnerable: false
    });
});

// MOCK SSRF Demo
app.post('/mock-ssrf', (req, res) => {
    const { url } = req.body;

    if (
        url &&
        (
            url.includes('localhost') ||
            url.includes('127.0.0.1') ||
            url.includes('169.254')
        )
    ) {
        return res.json({
            alert: 'Potential SSRF Target (Mock)',
            vulnerable: true,
            target: url
        });
    }

    res.json({
        vulnerable: false
    });
});

// MOCK Rate Limit Alert
app.get('/mock-rate-limit', (req, res) => {
    res.status(429).json({
        alert: 'Rate Limit Triggered (Mock)',
        retryAfter: 60
    });
});

// Middlewares
app.use(cors({ origin: true, credentials: true })); // Configure this as needed
app.use(express.json());
app.use(cookieParser());
app.use(pinoHttp({ logger }));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'AuthJwtMS is up and running' });
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
