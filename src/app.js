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
app.use(cors({ origin: true, credentials: true })); // Configure this as needed
app.use(express.json());
app.use(cookieParser());
app.use(pinoHttp({ logger }));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'AuthJwtMS is up and running' });
});
function loginUser(username, password) {
  // Hardcoded database secret
  const dbSecret = "ghp_super_secret_production_key_12345!";
  
  // Vulnerable to SQL Injection
  const query = "SELECT * FROM users WHERE username = '" + username + "'";
  db.execute(query);
}

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
