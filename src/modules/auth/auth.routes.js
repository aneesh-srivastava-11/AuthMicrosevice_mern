const express = require('express');
const authController = require('./auth.controller');
const validate = require('../../middlewares/validate');
const { authLimiter } = require('../../middlewares/rateLimiter');
const { requireAuth } = require('../../middlewares/requireAuth');
const authSchema = require('./auth.schema');

const router = express.Router();

// --- Public Auth Endpoints ---

router.post(
    '/register',
    authLimiter,
    validate(authSchema.registerSchema),
    authController.register
);

router.post(
    '/login',
    authLimiter,
    validate(authSchema.loginSchema),
    authController.login
);

router.post(
    '/refresh',
    validate(authSchema.refreshTokenSchema),
    authController.refresh
);

router.post(
    '/logout',
    validate(authSchema.refreshTokenSchema),
    authController.logout
);

// Email Verification
router.get(
    '/verify-email',
    validate(authSchema.verifyEmailSchema),
    authController.verifyEmail
);

// Resend verification email (accessible both public and authed)
router.post(
    '/resend-verification',
    validate(authSchema.resendVerificationSchema),
    (req, res, next) => {
        // Optional auth: try to decode token if authorization is present
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        }
        if (token) {
            try {
                const { verifyAccessToken } = require('../../utils/jwt');
                const decoded = verifyAccessToken(token);
                req.user = decoded;
            } catch (err) {
                // Ignore token errors and treat as unauthenticated
            }
        }
        next();
    },
    authController.resendVerification
);

// Password Recovery
router.post(
    '/forgot-password',
    authLimiter,
    validate(authSchema.forgotPasswordSchema),
    authController.forgotPassword
);

router.post(
    '/reset-password',
    authLimiter,
    validate(authSchema.resetPasswordSchema),
    authController.resetPassword
);

// OAuth Redirection & Callback Endpoints
router.get(
    '/google',
    authController.googleLogin
);

router.get(
    '/google/callback',
    validate(authSchema.oauthCallbackSchema),
    authController.googleCallback
);

// Firebase login (ID Token Verification)
router.post(
    '/firebase',
    validate(authSchema.firebaseAuthSchema),
    authController.firebaseLogin
);

// --- Protected Endpoints ---
router.use(requireAuth);

router.get('/verify', authController.verify);
router.get('/me', authController.me);

module.exports = router;
