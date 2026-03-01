const prisma = require('../../config/prisma');

const getUserByEmailAndTenant = async (email, tenantId) => {
    return prisma.user.findUnique({
        where: {
            tenantId_email: {
                tenantId,
                email,
            },
        },
    });
};

const getUserById = async (id) => {
    return prisma.user.findUnique({
        where: { id },
    });
};

const createUser = async (userData) => {
    return prisma.user.create({
        data: userData,
    });
};

const createRefreshToken = async (userId, token, expiresAt) => {
    return prisma.refreshToken.create({
        data: {
            token,
            userId,
            expiresAt,
        },
    });
};

const findRefreshToken = async (token) => {
    return prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
    });
};

const deleteRefreshToken = async (token) => {
    return prisma.refreshToken.deleteMany({
        where: { token },
    });
};

const deleteAllUserRefreshTokens = async (userId) => {
    return prisma.refreshToken.deleteMany({
        where: { userId },
    });
};

module.exports = {
    getUserByEmailAndTenant,
    getUserById,
    createUser,
    createRefreshToken,
    findRefreshToken,
    deleteRefreshToken,
    deleteAllUserRefreshTokens,
};
