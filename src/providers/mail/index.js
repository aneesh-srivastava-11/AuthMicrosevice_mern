const NodemailerProvider = require('./NodemailerProvider');
const env = require('../../config/env');

// Initialize Nodemailer mail provider using validated environment variables
const mailProvider = new NodemailerProvider({
    SMTP_HOST: env.SMTP_HOST,
    SMTP_PORT: env.SMTP_PORT,
    SMTP_USER: env.SMTP_USER,
    SMTP_PASS: env.SMTP_PASS,
    SMTP_FROM: env.SMTP_FROM,
});

module.exports = mailProvider;
