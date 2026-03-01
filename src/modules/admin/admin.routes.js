const express = require('express');
const adminController = require('./admin.controller');
const validate = require('../../middlewares/validate');
const { requireAuth, restrictTo } = require('../../middlewares/requireAuth');
const adminSchema = require('./admin.schema');

const router = express.Router();

// All admin routes are protected and restricted to ADMIN role
router.use(requireAuth);
router.use(restrictTo('ADMIN'));

router.get(
    '/users',
    validate(adminSchema.listUsersSchema),
    adminController.listUsers
);

router.patch(
    '/users/:id',
    validate(adminSchema.patchUserSchema),
    adminController.patchUser
);

router.delete(
    '/users/:id',
    validate(adminSchema.deleteUserSchema),
    adminController.deleteUser
);

router.get(
    '/analytics',
    validate(adminSchema.analyticsSchema),
    adminController.getAnalytics
);

module.exports = router;
