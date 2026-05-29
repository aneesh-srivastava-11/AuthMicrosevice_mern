const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient, checkRedisConfigured } = require('../config/redis');
const env = require('../config/env');
const logger = require('../config/logger');

const createLimiter = (options) => {
    let store;
    
    if (checkRedisConfigured()) {
        try {
            const client = getRedisClient();
            store = new RedisStore({
                sendCommand: async (...args) => {
                    // Send to redis only if connection is open, else fallback to standard execution
                    if (client && client.isOpen) {
                        return client.sendCommand(args);
                    }
                    throw new Error('Redis client is not open');
                },
                prefix: options.prefix || 'rl:',
            });
            logger.info({ prefix: options.prefix }, 'Redis-backed rate limiting configured');
        } catch (error) {
            logger.warn({ err: error.message }, 'Failed to initialize Redis rate limiter store, falling back to in-memory');
        }
    }

    return rateLimit({
        windowMs: options.windowMs || 15 * 60 * 1000,
        max: options.max || 100,
        message: options.message || 'Too many requests, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        store: store,
    });
};

const authLimiter = createLimiter({
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins default
    max: parseInt(env.RATE_LIMIT_MAX || '10', 10),
    message: 'Too many requests from this IP, please try again after 15 minutes',
    prefix: 'rl:auth:',
});

const adminLimiter = createLimiter({
    windowMs: 15 * 60 * 1000, // 15 mins default
    max: 100,
    message: 'Too many requests to admin operations, please try again later',
    prefix: 'rl:admin:',
});

module.exports = {
    authLimiter,
    adminLimiter,
};
