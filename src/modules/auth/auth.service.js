const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const authRepo = require('./auth.repository');
const AppError = require('../../utils/AppError');
const { generateTokens, verifyRefreshToken } = require('../../utils/jwt');
const env = require('../../config/env');
const ms = require('ms');
const logger = require('../../config/logger');
const mailService = require('../../providers/mail/mail.service');
const oauthProviders = require('../../providers/oauth');

// Helper to generate secure random tokens
const generateSecureToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const register = async (userData) => {
    const { tenantId, email, password, role } = userData;

    const existingUser = await authRepo.getUserByEmailAndTenant(email, tenantId);
    if (existingUser) {
        throw new AppError('Email already in use for this tenant', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await authRepo.createUser({
        tenantId,
        email,
        password: hashedPassword,
        role: role || 'USER',
        isEmailVerified: false,
    });

    // 1. Generate secure verification token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await authRepo.createVerificationToken(newUser.id, token, expiresAt);

    // 2. Send verification email (non-blocking)
    const verificationLink = `${env.GOOGLE_CALLBACK_URL ? env.GOOGLE_CALLBACK_URL.replace('/google/callback', '') : `http://localhost:${env.PORT}`}/auth/verify-email?token=${token}`;
    mailService.sendVerificationEmail(email, verificationLink).catch((err) => {
        logger.error({ err, userId: newUser.id }, 'Error sending registration verification email');
    });

    logger.info({ userId: newUser.id, email }, '👤 New user registered successfully, verification email dispatched');

    newUser.password = undefined; // Don't return password
    return newUser;
};

const login = async (loginData) => {
    const { tenantId, email, password } = loginData;

    const user = await authRepo.getUserByEmailAndTenant(email, tenantId);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        logger.warn({ email, tenantId }, '🔑 Login failed: Incorrect email or password');
        throw new AppError('Incorrect email or password for this tenant', 401);
    }

    if (!user.isActive) {
        logger.warn({ userId: user.id }, '🔑 Login failed: User account is inactive');
        throw new AppError('This user account is banned or inactive', 403);
    }

    // Email verification check
    if (!user.isEmailVerified && !env.ALLOW_UNVERIFIED_LOGIN) {
        logger.warn({ userId: user.id }, '🔑 Login rejected: Email address not verified');
        throw new AppError('Please verify your email address to log in.', 401);
    }

    const tokens = generateTokens(user);
    const expiresInMs = ms(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + expiresInMs);

    await authRepo.createRefreshToken(user.id, tokens.refreshToken, expiresAt);
    
    logger.info({ userId: user.id }, '🔑 User logged in successfully');

    user.password = undefined; // Hide password
    return { user, tokens };
};

const refreshTokens = async (refreshTokenString) => {
    if (!refreshTokenString) {
        throw new AppError('Refresh token is required', 400);
    }

    const decoded = verifyRefreshToken(refreshTokenString);
    const validToken = await authRepo.findRefreshToken(refreshTokenString);

    if (!validToken) {
        logger.warn({ refreshTokenString }, '🔑 Token rotation failed: Refresh token not found');
        throw new AppError('Refresh token not found or already used', 401);
    }

    if (!validToken.user.isActive) {
        throw new AppError('User account is banned', 403);
    }

    // Remove old token (Rotation)
    await authRepo.deleteRefreshToken(refreshTokenString);

    // Generate new tokens
    const tokens = generateTokens(validToken.user);
    const expiresInMs = ms(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + expiresInMs);

    // Save new refresh token
    await authRepo.createRefreshToken(validToken.user.id, tokens.refreshToken, expiresAt);

    logger.info({ userId: validToken.user.id }, '🔄 Refresh token rotated successfully');

    const user = validToken.user;
    user.password = undefined;

    return { user, tokens };
};

const logout = async (refreshTokenString) => {
    if (refreshTokenString) {
        await authRepo.deleteRefreshToken(refreshTokenString);
        logger.info('🔑 User logged out and refresh token revoked');
    }
};

const me = async (userId) => {
    const user = await authRepo.getUserById(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    user.password = undefined;
    return user;
};

// --- EMAIL VERIFICATION SERVICE IMPLEMENTATION ---

const verifyEmail = async (tokenString) => {
    if (!tokenString) {
        throw new AppError('Verification token is required', 400);
    }

    const record = await authRepo.findVerificationToken(tokenString);
    if (!record) {
        throw new AppError('Invalid or expired verification token', 400);
    }

    if (record.expiresAt < new Date()) {
        await authRepo.deleteVerificationToken(tokenString).catch(() => {});
        throw new AppError('Verification token has expired', 400);
    }

    // Mark as verified
    await authRepo.updateUserEmailVerified(record.userId, true);
    
    // Delete single-use verification token
    await authRepo.deleteVerificationToken(tokenString).catch(() => {});

    // Send Welcome Email (non-blocking)
    mailService.sendWelcomeEmail(record.user.email).catch((err) => {
        logger.error({ err, userId: record.userId }, 'Failed to send welcome email');
    });

    logger.info({ userId: record.userId }, '📧 Email successfully verified');
    
    return { success: true, email: record.user.email };
};

const resendVerification = async (email, tenantId, authenticatedUserId = null) => {
    let user;
    if (authenticatedUserId) {
        user = await authRepo.getUserById(authenticatedUserId);
    } else {
        if (!email || !tenantId) {
            throw new AppError('Email and Tenant ID are required to resend verification', 400);
        }
        user = await authRepo.getUserByEmailAndTenant(email, tenantId);
    }

    if (!user) {
        // Return success response to prevent account enumeration
        logger.info({ email, tenantId }, 'Resend requested for non-existent user email');
        return { success: true };
    }

    if (user.isEmailVerified) {
        throw new AppError('Email is already verified', 400);
    }

    // Invalidate/Delete old verification token if any exists
    // (Prisma relation deletes will handle it or we can ignore error if none exists)
    // Generating a new token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await authRepo.createVerificationToken(user.id, token, expiresAt);

    const verificationLink = `${env.GOOGLE_CALLBACK_URL ? env.GOOGLE_CALLBACK_URL.replace('/google/callback', '') : `http://localhost:${env.PORT}`}/auth/verify-email?token=${token}`;
    mailService.sendVerificationEmail(user.email, verificationLink).catch((err) => {
        logger.error({ err, userId: user.id }, 'Error sending resent verification email');
    });

    logger.info({ userId: user.id, email: user.email }, '📧 Verification email resent successfully');
    
    return { success: true };
};

// --- PASSWORD RESET SERVICE IMPLEMENTATION ---

const forgotPassword = async (email, tenantId) => {
    if (!email || !tenantId) {
        throw new AppError('Email and Tenant ID are required', 400);
    }

    const user = await authRepo.getUserByEmailAndTenant(email, tenantId);
    if (!user) {
        // Log locally, but return a generic success message to prevent user enumeration
        logger.info({ email, tenantId }, 'Password reset requested for non-existent user');
        return { success: true };
    }

    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await authRepo.createPasswordResetToken(user.id, token, expiresAt);

    const resetLink = `${env.GOOGLE_CALLBACK_URL ? env.GOOGLE_CALLBACK_URL.replace('/google/callback', '') : `http://localhost:${env.PORT}`}/auth/reset-password?token=${token}`;
    mailService.sendPasswordResetEmail(user.email, resetLink).catch((err) => {
        logger.error({ err, userId: user.id }, 'Error sending password reset email');
    });

    logger.info({ userId: user.id }, '🔒 Password reset token generated and email dispatched');
    return { success: true };
};

const resetPassword = async (tokenString, newPassword) => {
    if (!tokenString || !newPassword) {
        throw new AppError('Token and new password are required', 400);
    }

    const record = await authRepo.findPasswordResetToken(tokenString);
    if (!record) {
        throw new AppError('Invalid or expired password reset token', 400);
    }

    if (record.expiresAt < new Date()) {
        await authRepo.deletePasswordResetToken(tokenString).catch(() => {});
        throw new AppError('Password reset token has expired', 400);
    }

    // Hash the new password and update user record
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await authRepo.updateUserPassword(record.userId, hashedPassword);

    // Revoke ALL refresh tokens for safety
    await authRepo.deleteAllUserRefreshTokens(record.userId);

    // Delete single-use password reset token
    await authRepo.deletePasswordResetToken(tokenString).catch(() => {});

    logger.info({ userId: record.userId }, '🔒 User password updated and refresh tokens revoked');
    return { success: true };
};

// --- OAUTH LOGIC SERVICE ---

const handleOAuthCallback = async (providerName, query) => {
    const provider = oauthProviders[providerName];
    if (!provider) {
        throw new AppError(`OAuth provider ${providerName} is not supported`, 400);
    }

    const profile = await provider.handleCallback(query);
    
    // Upsert the OAuth user in the database
    const user = await authRepo.upsertOAuthUser({
        email: profile.email,
        tenantId: profile.tenantId,
        provider: providerName,
        providerId: profile.providerId,
        name: profile.name,
    });

    if (!user.isActive) {
        throw new AppError('User account is banned or inactive', 403);
    }

    // Generate local JWT tokens for the session
    const tokens = generateTokens(user);
    const expiresInMs = ms(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + expiresInMs);

    await authRepo.createRefreshToken(user.id, tokens.refreshToken, expiresAt);

    logger.info({ userId: user.id, provider: providerName }, '👤 OAuth user authenticated and session established');

    user.password = undefined;
    return { user, tokens };
};

const handleFirebaseOAuth = async (idToken, tenantId) => {
    if (!idToken) {
        throw new AppError('Firebase ID token is required', 400);
    }

    const provider = oauthProviders.firebase;
    if (!provider) {
        throw new AppError('Firebase authentication is not initialized', 500);
    }

    const profile = await provider.verifyToken(idToken);
    
    // Upsert the Firebase user as a 'google' or 'firebase' authenticated user
    const user = await authRepo.upsertOAuthUser({
        email: profile.email,
        tenantId: tenantId || 'default',
        provider: 'firebase',
        providerId: profile.providerId,
        name: profile.name,
    });

    if (!user.isActive) {
        throw new AppError('User account is banned or inactive', 403);
    }

    // Generate local tokens
    const tokens = generateTokens(user);
    const expiresInMs = ms(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + expiresInMs);

    await authRepo.createRefreshToken(user.id, tokens.refreshToken, expiresAt);

    logger.info({ userId: user.id, provider: 'firebase' }, '👤 Firebase authenticated user session established');

    user.password = undefined;
    return { user, tokens };
};

module.exports = {
    register,
    login,
    refreshTokens,
    logout,
    me,
    
    // Verification
    verifyEmail,
    resendVerification,
    
    // Reset Password
    forgotPassword,
    resetPassword,

    // OAuth
    handleOAuthCallback,
    handleFirebaseOAuth,
};
