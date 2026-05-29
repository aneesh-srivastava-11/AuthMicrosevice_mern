const { z } = require('zod');

const listUsersSchema = z.object({
    query: z.object({
        tenantId: z.string().min(1, 'Tenant ID is required for filtering by tenant'),
    }),
});

const patchUserSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid User ID'),
    }),
    body: z.object({
        role: z.enum(['USER', 'ADMIN']).optional(),
        isActive: z.boolean().optional(),
        password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    }),
});

const deleteUserSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid User ID'),
    }),
});

const analyticsSchema = z.object({
    query: z.object({
        tenantId: z.string().min(1, 'Tenant ID is required'),
        days: z.string().regex(/^\d+$/).default('7'),
    }),
});

module.exports = {
    listUsersSchema,
    patchUserSchema,
    deleteUserSchema,
    analyticsSchema,
};
