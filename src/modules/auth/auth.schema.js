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

const verifyEmailSchema = z.object({
    query: z.object({
        token: z.string().min(1, 'Verification token is required'),
    }),
});

const resendVerificationSchema = z.object({
    body: z.object({
        email: z.string().email().optional(),
        tenantId: z.string().min(1, 'Tenant ID is required').optional(),
    }),
});

const forgotPasswordSchema = z.object({
    body: z.object({
        tenantId: z.string().min(1, 'Tenant ID is required'),
        email: z.string().email(),
    }),
});

const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Token is required'),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    }),
});

const firebaseAuthSchema = z.object({
    body: z.object({
        idToken: z.string().min(1, 'Firebase ID Token is required'),
        tenantId: z.string().min(1, 'Tenant ID is required').optional(),
    }),
});

const oauthCallbackSchema = z.object({
    query: z.object({
        code: z.string().min(1, 'Authorization code is required'),
        state: z.string().optional(),
    }),
});

module.exports = {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    verifyEmailSchema,
    resendVerificationSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    firebaseAuthSchema,
    oauthCallbackSchema,
};
