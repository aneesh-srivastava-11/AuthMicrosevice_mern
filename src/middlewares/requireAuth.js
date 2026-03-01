const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/jwt');

const requireAuth = (req, res, next) => {
    try {
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            return next(
                new AppError('You are not logged in! Please log in to get access.', 401)
            );
        }

        const decoded = verifyAccessToken(token);

        // Attach user to request
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('You are not logged in.', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
};

module.exports = {
    requireAuth,
    restrictTo,
};
