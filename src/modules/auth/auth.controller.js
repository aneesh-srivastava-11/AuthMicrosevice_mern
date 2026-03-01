const authService = require('./auth.service');
const ms = require('ms');
const env = require('../../config/env');

// Helper to set cookie
const setCookie = (res, token) => {
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: ms(env.JWT_ACCESS_EXPIRES_IN), // match access token
    });
};

const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({
            status: 'success',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { user, tokens } = await authService.login(req.body);

        setCookie(res, tokens.accessToken);

        res.status(200).json({
            status: 'success',
            data: {
                user,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

const refresh = async (req, res, next) => {
    try {
        const refreshToken = req.body.refreshToken;
        const { user, tokens } = await authService.refreshTokens(refreshToken);

        setCookie(res, tokens.accessToken);

        res.status(200).json({
            status: 'success',
            data: {
                user,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

const verify = async (req, res, next) => {
    try {
        // If we land here, requireAuth middleware already validated the token
        res.status(200).json({
            status: 'success',
            data: {
                valid: true,
                user: req.user,
            },
        });
    } catch (error) {
        next(error);
    }
};

const me = async (req, res, next) => {
    try {
        const user = await authService.me(req.user.id);
        res.status(200).json({
            status: 'success',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const refreshToken = req.body.refreshToken;
        await authService.logout(refreshToken);

        res.cookie('jwt', 'loggedout', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true,
        });

        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    refresh,
    verify,
    me,
    logout,
};
