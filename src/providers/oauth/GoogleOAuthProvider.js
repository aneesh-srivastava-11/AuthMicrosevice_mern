const OAuthProvider = require('./OAuthProvider');
const env = require('../../config/env');
const logger = require('../../config/logger');

class GoogleOAuthProvider extends OAuthProvider {
    constructor() {
        super();
        this.clientId = env.GOOGLE_CLIENT_ID;
        this.clientSecret = env.GOOGLE_CLIENT_SECRET;
        this.callbackUrl = env.GOOGLE_CALLBACK_URL;
    }

    getRedirectUrl(tenantId) {
        const state = encodeURIComponent(JSON.stringify({ tenantId }));
        const scope = encodeURIComponent('openid email profile');
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.callbackUrl)}&response_type=code&scope=${scope}&state=${state}`;
    }

    async handleCallback(query) {
        const { code, state } = query;
        if (!code) {
            throw new Error('No authorization code provided');
        }

        let tenantId = 'default';
        if (state) {
            try {
                const parsedState = JSON.parse(decodeURIComponent(state));
                tenantId = parsedState.tenantId || 'default';
            } catch (err) {
                logger.warn({ err }, 'Failed to parse OAuth state');
            }
        }

        // Exchange code for Google access and identity tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: this.callbackUrl,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const errText = await tokenResponse.text();
            logger.error({ errText }, 'Google OAuth token exchange failed');
            throw new Error('Failed to exchange authorization code for tokens');
        }

        const tokens = await tokenResponse.json();
        
        // Retrieve user profile data using access token
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userResponse.ok) {
            const errText = await userResponse.text();
            logger.error({ errText }, 'Google Userinfo fetch failed');
            throw new Error('Failed to retrieve user profile from Google');
        }

        const profile = await userResponse.json();

        return {
            email: profile.email,
            providerId: profile.sub,
            emailVerified: profile.email_verified || false,
            name: profile.name,
            tenantId,
        };
    }
}

module.exports = GoogleOAuthProvider;
