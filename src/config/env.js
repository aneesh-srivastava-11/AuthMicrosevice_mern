const { z } = require('zod');
const logger = require('./logger');
require('dotenv').config();

const envSchema = z.object({
    PORT: z.string().default('3000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().url(),
    JWT_ACCESS_SECRET: z.string().min(10),
    JWT_REFRESH_SECRET: z.string().min(10),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    
    // Email Verification & Password Reset Login restriction
    ALLOW_UNVERIFIED_LOGIN: z.preprocess((val) => val === 'true', z.boolean()).default(false),
    
    // Mail Credentials
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().default('587'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().default('no-reply@authjwtms.com'),
    
    // Redis Credentials (Rate Limiting & Health)
    REDIS_URL: z.string().url().optional(),
    REDIS_HOST: z.string().optional(),
    REDIS_PORT: z.string().default('6379'),
    
    // Rate Limiting configs
    RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
    RATE_LIMIT_MAX: z.string().default('10'),
    
    // Google OAuth Credentials
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CALLBACK_URL: z.string().optional(),
    
    // Firebase Service Account configuration
    FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    logger.error('❌ Invalid environment variables', _env.error.format());
    throw new Error('Invalid environment variables');
}

module.exports = _env.data;
