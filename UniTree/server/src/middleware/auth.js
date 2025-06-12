const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const logger = require('../utils/logger');

// Middleware to authenticate user tokens
const auth = async (req, res, next) => {
  try {
    let token;

    console.log('Auth middleware called for:', req.method, req.path);
    console.log('Authorization header:', req.headers.authorization ? 'Present' : 'Missing');

    // Check if auth header exists and has Bearer format
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extracted from Bearer header:', token ? `${token.substring(0, 20)}...` : 'null');
    }

    if (!token) {
      console.log('No token found, returning 401');
      return res.status(401).json({
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', { id: decoded.id, iat: decoded.iat, exp: decoded.exp });
      
      // Get user from token
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log('User not found for decoded token ID:', decoded.id);
        return res.status(401).json({
          message: 'User no longer exists'
        });
      }

      console.log('User found and authenticated:', { id: user._id, email: user.email });

      // Set both user and userId for backward compatibility
      req.user = user;
      req.user.userId = user._id;

      next();
    } catch (err) {
      console.error('Token verification error:', err.message);
      return res.status(401).json({
        message: 'Token is invalid or expired'
      });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({
      message: 'Server error in auth middleware'
    });
  }
};

// Middleware to authenticate admin tokens
const authAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
};

// Middleware to check if admin has required role
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.admin || req.admin.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

module.exports = {
  auth,
  authAdmin,
  requireRole
}; 