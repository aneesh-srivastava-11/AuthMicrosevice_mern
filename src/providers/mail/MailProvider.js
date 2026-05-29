/**
 * Abstract MailProvider class to define interface for sending emails.
 */
class MailProvider {
    /**
     * Send an email.
     * @param {Object} options
     * @param {string} options.to - Recipient email address
     * @param {string} options.subject - Email subject
     * @param {string} options.html - HTML content of the email
     * @param {string} [options.text] - Plain text fallback of the email
     * @returns {Promise<boolean>} - True if sent, false otherwise
     */
    async sendMail(options) {
        throw new Error('Method sendMail() must be implemented');
    }
}

module.exports = MailProvider;
