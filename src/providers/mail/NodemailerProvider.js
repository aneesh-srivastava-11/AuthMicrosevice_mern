const nodemailer = require('nodemailer');
const MailProvider = require('./MailProvider');
const logger = require('../../config/logger');

class NodemailerProvider extends MailProvider {
    constructor(config) {
        super();
        this.from = config.SMTP_FROM || 'no-reply@authjwtms.com';
        
        this.transporter = nodemailer.createTransport({
            host: config.SMTP_HOST,
            port: parseInt(config.SMTP_PORT || '587', 10),
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS,
            },
            secure: parseInt(config.SMTP_PORT || '587', 10) === 465,
        });
    }

    async sendMail(options) {
        try {
            const mailOptions = {
                from: this.from,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || '',
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info({ messageId: info.messageId, recipient: options.to }, '📧 Email sent successfully via Nodemailer');
            return true;
        } catch (error) {
            logger.error({ err: error, recipient: options.to }, '❌ Email sending failed');
            return false; // Fail gracefully
        }
    }
}

module.exports = NodemailerProvider;
