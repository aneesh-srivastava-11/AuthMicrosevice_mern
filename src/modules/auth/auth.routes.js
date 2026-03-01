const express = require('express');
const authController = require('./auth.controller');
const validate = require('../../middlewares/validate');
const { authLimiter } = require('../../middlewares/rateLimiter');
const { requireAuth } = require('../../middlewares/requireAuth');
const authSchema = require('./auth.schema');

const router = express.Router();

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

// Protected routes
router.use(requireAuth);

router.get('/verify', authController.verify);
router.get('/me', authController.me);

module.exports = router;
