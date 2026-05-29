const fs = require('fs');
const path = require('path');
const mailProvider = require('./index');
const logger = require('../../config/logger');

const readTemplate = (templateName) => {
    const filePath = path.join(__dirname, '../../templates/email', `${templateName}.html`);
    return fs.readFileSync(filePath, 'utf-8');
};

const sendVerificationEmail = async (to, verificationLink) => {
    try {
        let html = readTemplate('verification');
        html = html.replace(/{{verificationLink}}/g, verificationLink);
        
        return await mailProvider.sendMail({
            to,
            subject: 'Verify Your Email Address - AuthJwtMS',
            html,
            text: `Please verify your email by clicking the link: ${verificationLink}`,
        });
    } catch (error) {
        logger.error({ err: error, recipient: to }, 'Failed to send verification email');
        return false;
    }
};

const sendPasswordResetEmail = async (to, resetLink) => {
    try {
        let html = readTemplate('passwordReset');
        html = html.replace(/{{resetLink}}/g, resetLink);
        
        return await mailProvider.sendMail({
            to,
            subject: 'Reset Your Password - AuthJwtMS',
            html,
            text: `Please reset your password by clicking the link: ${resetLink}`,
        });
    } catch (error) {
        logger.error({ err: error, recipient: to }, 'Failed to send password reset email');
        return false;
    }
};

const sendWelcomeEmail = async (to) => {
    try {
        const html = readTemplate('welcome');
        
        return await mailProvider.sendMail({
            to,
            subject: 'Welcome to AuthJwtMS',
            html,
            text: `Your email has been successfully verified! Welcome aboard.`,
        });
    } catch (error) {
        logger.error({ err: error, recipient: to }, 'Failed to send welcome email');
        return false;
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
};
