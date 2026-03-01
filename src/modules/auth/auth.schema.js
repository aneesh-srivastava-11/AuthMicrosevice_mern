const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        tenantId: z.string().min(1, 'Tenant ID is required'),
        email: z.string().email(),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        role: z.enum(['USER', 'ADMIN']).optional(),
    }),
});

const loginSchema = z.object({
    body: z.object({
        tenantId: z.string().min(1, 'Tenant ID is required'),
        email: z.string().email(),
        password: z.string().min(1, 'Password is required'),
    }),
});

const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh Token is required'),
    }),
});

module.exports = {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
};
