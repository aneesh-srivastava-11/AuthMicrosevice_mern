const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('./AppError');

const generateTokens = (user) => {
    const payload = {
        id: user.id,
        tenantId: user.tenantId,
        role: user.role,
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    });

    const refreshToken = jwt.sign({ id: user.id }, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Token expired', 401);
        }
        throw new AppError('Invalid token', 401);
    }
};

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, env.JWT_REFRESH_SECRET);
    } catch (error) {
        throw new AppError('Invalid refresh token', 401);
    }
};

module.exports = {
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken,
};
