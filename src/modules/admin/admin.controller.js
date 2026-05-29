const adminService = require('./admin.service');

const listUsers = async (req, res, next) => {
    try {
        const { tenantId } = req.query;
        const users = await adminService.listUsers(tenantId);

        res.status(200).json({
            status: 'success',
            data: { users },
        });
    } catch (error) {
        next(error);
    }
};

const patchUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await adminService.patchUser(id, req.body);

        res.status(200).json({
            status: 'success',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        await adminService.deleteUser(id);

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

const getAnalytics = async (req, res, next) => {
    try {
        const { tenantId, days } = req.query;
        const analytics = await adminService.getAnalytics(tenantId, days);

        res.status(200).json({
            status: 'success',
            data: { analytics },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listUsers,
    patchUser,
    deleteUser,
    getAnalytics,
};
