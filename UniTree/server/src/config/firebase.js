const admin = require('firebase-admin');

// Firebase Admin SDK configuration
const firebaseConfig = {
  projectId: 'unitree-462606',
};

// Initialize Firebase Admin (only if not already initialized)
if (!admin.apps.length) {
  try {
    // Try to use service account credentials in production
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: firebaseConfig.projectId,
      });
    } else {
      // For development, initialize without credentials (will work for token verification)
      admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
  } catch (error) {
    console.warn('Firebase Admin initialization warning:', error.message);
    // Initialize with minimal config for development
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
}

const auth = admin.auth();

module.exports = { admin, auth }; 