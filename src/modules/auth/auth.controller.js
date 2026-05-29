const authService = require('./auth.service');
const ms = require('ms');
const env = require('../../config/env');
const oauthProviders = require('../../providers/oauth');

// Helper to set HTTP-only cookie
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

// --- EMAIL VERIFICATION CONTROLLERS ---

const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.query;
        const result = await authService.verifyEmail(token);
        
        res.status(200).json({
            status: 'success',
            message: 'Email verified successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const resendVerification = async (req, res, next) => {
    try {
        const { email, tenantId } = req.body;
        // User could be authenticated or not. If authenticated, pass user ID
        const authenticatedUserId = req.user ? req.user.id : null;
        
        await authService.resendVerification(email, tenantId, authenticatedUserId);
        
        res.status(200).json({
            status: 'success',
            message: 'If the account exists and is not verified, a new verification link has been sent.',
        });
    } catch (error) {
        next(error);
    }
};

// --- PASSWORD RESET CONTROLLERS ---

const forgotPassword = async (req, res, next) => {
    try {
        const { email, tenantId } = req.body;
        await authService.forgotPassword(email, tenantId);
        
        res.status(200).json({
            status: 'success',
            message: 'If a matching account is found, a password reset link has been sent.',
        });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        await authService.resetPassword(token, newPassword);
        
        res.status(200).json({
            status: 'success',
            message: 'Password reset successfully. Please log in with your new password.',
        });
    } catch (error) {
        next(error);
    }
};

// --- OAUTH CONTROLLERS ---

const googleLogin = (req, res, next) => {
    try {
        const { tenantId } = req.query;
        if (!oauthProviders.google.clientId || !oauthProviders.google.clientSecret) {
            return res.status(501).json({
                status: 'error',
                message: 'Google OAuth is not configured on this server.',
            });
        }
        const redirectUrl = oauthProviders.google.getRedirectUrl(tenantId || 'default');
        res.redirect(redirectUrl);
    } catch (error) {
        next(error);
    }
};

const googleCallback = async (req, res, next) => {
    try {
        const { user, tokens } = await authService.handleOAuthCallback('google', req.query);
        
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

const firebaseLogin = async (req, res, next) => {
    try {
        const { idToken, tenantId } = req.body;
        const { user, tokens } = await authService.handleFirebaseOAuth(idToken, tenantId);
        
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

module.exports = {
    register,
    login,
    refresh,
    verify,
    me,
    logout,
    
    // Verification
    verifyEmail,
    resendVerification,
    
    // Reset Password
    forgotPassword,
    resetPassword,
    
    // OAuth
    googleLogin,
    googleCallback,
    firebaseLogin,
};
