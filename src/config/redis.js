const { createClient } = require('redis');
const logger = require('./logger');

let redisClient = null;
let isRedisConfigured = false;

if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    isRedisConfigured = true;
    const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`;
    
    redisClient = createClient({
        url: redisUrl,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    logger.warn('Redis reconnection failed too many times, disabling Redis functionality');
                    return new Error('Redis connection failed');
                }
                return Math.min(retries * 100, 3000);
            }
        }
    });

    redisClient.on('error', (err) => {
        logger.error({ err }, 'Redis Client Error');
    });

    redisClient.on('connect', () => {
        logger.info('🔌 Connecting to Redis...');
    });

    redisClient.on('ready', () => {
        logger.info('📦 Connected to Redis successfully');
    });

    redisClient.connect().catch((err) => {
        logger.error({ err }, 'Failed to initialize Redis connection');
    });
}

const getRedisClient = () => redisClient;
const checkRedisConfigured = () => isRedisConfigured;

module.exports = {
    getRedisClient,
    checkRedisConfigured,
};
