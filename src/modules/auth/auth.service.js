const bcrypt = require('bcryptjs');
const authRepo = require('./auth.repository');
const AppError = require('../../utils/AppError');
const { generateTokens, verifyRefreshToken } = require('../../utils/jwt');
const env = require('../../config/env');
const ms = require('ms');

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
    });

    newUser.password = undefined; // Don't return password

    return newUser;
};

const login = async (loginData) => {
    const { tenantId, email, password } = loginData;

    const user = await authRepo.getUserByEmailAndTenant(email, tenantId);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError('Incorrect email or password for this tenant', 401);
    }

    if (!user.isActive) {
        throw new AppError('This user account is banned or inactive', 403);
    }

    const tokens = generateTokens(user);

    // Calculate generic token expiration date
    const expiresInMs = ms(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + expiresInMs);

    // Store refresh token in db
    await authRepo.createRefreshToken(user.id, tokens.refreshToken, expiresAt);

    user.password = undefined; // Hide password

    return { user, tokens };
};

const refreshTokens = async (refreshTokenString) => {
    if (!refreshTokenString) {
        throw new AppError('Refresh token is required', 400);
    }

    // Verify the JWT format/signature
    const decoded = verifyRefreshToken(refreshTokenString);

    // Check if it exists in the database
    const validToken = await authRepo.findRefreshToken(refreshTokenString);

    if (!validToken) {
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

    const user = validToken.user;
    user.password = undefined;

    return { user, tokens };
};

const logout = async (refreshTokenString) => {
    if (refreshTokenString) {
        await authRepo.deleteRefreshToken(refreshTokenString);
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

module.exports = {
    register,
    login,
    refreshTokens,
    logout,
    me,
};
