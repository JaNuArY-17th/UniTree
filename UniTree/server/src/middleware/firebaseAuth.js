const { auth } = require('../config/firebase');
const logger = require('../utils/logger');

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    
    if (!authorization) {
      return res.status(401).json({
        message: 'No authorization header provided'
      });
    }

    const token = authorization.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        message: 'No token provided'
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    logger.error('Firebase token verification error:', error);
    return res.status(401).json({
      message: 'Invalid token'
    });
  }
};

module.exports = { verifyFirebaseToken }; 