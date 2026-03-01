const bcrypt = require('bcryptjs');
const adminRepo = require('./admin.repository');
const authRepo = require('../auth/auth.repository');
const AppError = require('../../utils/AppError');

const listUsers = async (tenantId) => {
    return adminRepo.getUsers(tenantId);
};

const patchUser = async (id, updateData) => {
    const user = await adminRepo.getUserById(id);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const payload = {};
    if (updateData.role !== undefined) payload.role = updateData.role;
    if (updateData.isActive !== undefined) payload.isActive = updateData.isActive;

    if (updateData.password) {
        payload.password = await bcrypt.hash(updateData.password, 12);
    }

    const updatedUser = await adminRepo.updateUser(id, payload);

    // If password changed, or user banned, revoke tokens
    if (updateData.password || updateData.isActive === false) {
        await authRepo.deleteAllUserRefreshTokens(id);
    }

    return updatedUser;
};

const deleteUser = async (id) => {
    const user = await adminRepo.getUserById(id);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    return adminRepo.deleteUser(id);
};

const getAnalytics = async (tenantId, days) => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - parseInt(days));

    const signups = await adminRepo.getSignupsAfterDate(tenantId, pastDate);

    // Group by day count
    const dailyCounts = {};
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dailyCounts[dateStr] = 0;
    }

    signups.forEach((s) => {
        const dateStr = s.createdAt.toISOString().split('T')[0];
        if (dailyCounts[dateStr] !== undefined) {
            dailyCounts[dateStr]++;
        }
    });

    return {
        period: `${days} days`,
        totalSignups: signups.length,
        dailyCounts,
    };
};

module.exports = {
    listUsers,
    patchUser,
    deleteUser,
    getAnalytics,
};
