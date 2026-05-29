const GoogleOAuthProvider = require('./GoogleOAuthProvider');
const FirebaseOAuthProvider = require('./FirebaseOAuthProvider');

// Instantiate OAuth Singletons
const googleOAuthProvider = new GoogleOAuthProvider();
const firebaseOAuthProvider = new FirebaseOAuthProvider();

module.exports = {
    google: googleOAuthProvider,
    firebase: firebaseOAuthProvider,
};
