const admin = require('firebase-admin');
const OAuthProvider = require('./OAuthProvider');
const env = require('../../config/env');
const logger = require('../../config/logger');

class FirebaseOAuthProvider extends OAuthProvider {
    constructor() {
        super();
        
        // Initialize Firebase Admin SDK if not already done
        if (admin.apps.length === 0) {
            try {
                if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
                    let serviceAccount;
                    try {
                        serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
                    } catch (parseError) {
                        // In case it's a file path rather than a JSON string, try to read the file
                        const fs = require('fs');
                        const path = require('path');
                        const resolvedPath = path.resolve(env.FIREBASE_SERVICE_ACCOUNT_JSON);
                        if (fs.existsSync(resolvedPath)) {
                            serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
                        } else {
                            throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is neither valid JSON nor a valid file path');
                        }
                    }

                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount)
                    });
                    logger.info('🔥 Firebase Admin SDK initialized using service account JSON');
                } else {
                    // Fallback to application default credentials
                    admin.initializeApp({
                        credential: admin.credential.applicationDefault()
                    });
                    logger.info('🔥 Firebase Admin SDK initialized using applicationDefault');
                }
            } catch (error) {
                logger.warn({ err: error.message }, 'Failed to initialize Firebase Admin SDK. OAuth via Firebase ID tokens will be unavailable until FIREBASE_SERVICE_ACCOUNT_JSON is configured.');
            }
        }
    }

    /**
     * Verifies a Firebase ID token sent from the client.
     * @param {string} idToken - Client's Firebase ID token
     * @returns {Promise<Object>} - User profile information
     */
    async verifyToken(idToken) {
        try {
            if (admin.apps.length === 0) {
                throw new Error('Firebase Admin SDK is not initialized');
            }
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            return {
                email: decodedToken.email,
                providerId: decodedToken.uid,
                emailVerified: decodedToken.email_verified || false,
                name: decodedToken.name,
                picture: decodedToken.picture
            };
        } catch (error) {
            logger.error({ err: error }, 'Failed to verify Firebase ID token');
            throw error;
        }
    }
}

module.exports = FirebaseOAuthProvider;
