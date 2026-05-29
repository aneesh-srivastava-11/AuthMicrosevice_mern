const prisma = require('../../config/prisma');

const getUsers = async (tenantId) => {
    return prisma.user.findMany({
        where: { tenantId },
        select: {
            id: true,
            tenantId: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};

const getUserById = async (id) => {
    return prisma.user.findUnique({
        where: { id },
    });
};

const updateUser = async (id, data) => {
    return prisma.user.update({
        where: { id },
        data,
        select: {
            id: true,
            tenantId: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};

const deleteUser = async (id) => {
    return prisma.user.delete({
        where: { id },
    });
};

const getSignupsAfterDate = async (tenantId, date) => {
    return prisma.user.findMany({
        where: {
            tenantId,
            createdAt: {
                gte: date,
            },
        },
        select: {
            createdAt: true,
        },
    });
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getSignupsAfterDate,
};
