/**
 * Abstract OAuthProvider class to define interface for OAuth providers.
 */
class OAuthProvider {
    /**
     * Get the redirect URL to initiate OAuth flow.
     * @param {string} tenantId - Tenant ID
     * @returns {string}
     */
    getRedirectUrl(tenantId) {
        throw new Error('Method getRedirectUrl() must be implemented');
    }

    /**
     * Handle authorization callback and get user info.
     * @param {Object} query - Express request query parameters
     * @returns {Promise<Object>} - User profile data (email, providerId, etc.)
     */
    async handleCallback(query) {
        throw new Error('Method handleCallback() must be implemented');
    }
}

module.exports = OAuthProvider;
