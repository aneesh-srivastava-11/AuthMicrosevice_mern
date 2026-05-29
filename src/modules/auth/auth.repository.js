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

// --- EMAIL VERIFICATION REPOSITORY METHODS ---

const createVerificationToken = async (userId, token, expiresAt) => {
    // Upsert verification token for the user since user has a 1-to-1 relationship with verificationToken
    return prisma.verificationToken.upsert({
        where: { userId },
        update: {
            token,
            expiresAt,
            createdAt: new Date(),
        },
        create: {
            userId,
            token,
            expiresAt,
        },
    });
};

const findVerificationToken = async (token) => {
    return prisma.verificationToken.findUnique({
        where: { token },
        include: { user: true },
    });
};

const deleteVerificationToken = async (token) => {
    return prisma.verificationToken.delete({
        where: { token },
    });
};

const updateUserEmailVerified = async (userId, isVerified) => {
    return prisma.user.update({
        where: { id: userId },
        data: {
            isEmailVerified: isVerified,
            emailVerifiedAt: isVerified ? new Date() : null,
        },
    });
};

// --- PASSWORD RESET REPOSITORY METHODS ---

const createPasswordResetToken = async (userId, token, expiresAt) => {
    return prisma.passwordResetToken.upsert({
        where: { userId },
        update: {
            token,
            expiresAt,
            createdAt: new Date(),
        },
        create: {
            userId,
            token,
            expiresAt,
        },
    });
};

const findPasswordResetToken = async (token) => {
    return prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
    });
};

const deletePasswordResetToken = async (token) => {
    return prisma.passwordResetToken.delete({
        where: { token },
    });
};

const updateUserPassword = async (userId, hashedPassword) => {
    return prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
        },
    });
};

// --- OAUTH REPOSITORY METHODS ---

const getUserByProviderId = async (provider, providerId) => {
    return prisma.user.findFirst({
        where: {
            provider,
            providerId,
        },
    });
};

const upsertOAuthUser = async (oauthData) => {
    const { email, tenantId, provider, providerId, name } = oauthData;
    
    // Check if user already exists with email under this tenant
    const existingUser = await getUserByEmailAndTenant(email, tenantId);
    
    if (existingUser) {
        // Link the provider details to the existing local account if not linked
        if (!existingUser.providerId || existingUser.provider !== provider) {
            return prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    provider,
                    providerId,
                    // If OAuth authenticated, we assume email is verified
                    isEmailVerified: true,
                    emailVerifiedAt: new Date(),
                },
            });
        }
        return existingUser;
    }

    // Otherwise create a new user representing the OAuth account
    return prisma.user.create({
        data: {
            email,
            tenantId,
            provider,
            providerId,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            role: 'USER',
        },
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
    
    // Verification
    createVerificationToken,
    findVerificationToken,
    deleteVerificationToken,
    updateUserEmailVerified,
    
    // Reset Password
    createPasswordResetToken,
    findPasswordResetToken,
    deletePasswordResetToken,
    updateUserPassword,

    // OAuth
    getUserByProviderId,
    upsertOAuthUser,
};
