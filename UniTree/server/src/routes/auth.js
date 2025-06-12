const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const EmailVerification = require('../models/EmailVerification');
const logger = require('../utils/logger');
const emailService = require('../utils/emailService');
const { auth } = require('../middleware/auth');

// Send verification code (Step 1 of registration)
router.post('/send-verification-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Please provide an email'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user already exists with this email (case insensitive)
    let existingUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') }
    });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email already used in another account'
      });
    }

    // Check if email exists in students collection (case insensitive)
    const student = await Student.findOne({ 
      email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') }
    });
    if (!student) {
      return res.status(400).json({
        message: 'Please use your university email'
      });
    }

    // Check for existing verification that hasn't expired
    let existingVerification = await EmailVerification.findActiveVerification(trimmedEmail, 'registration');
    
    if (existingVerification) {
      // If there's an active verification less than 1 minute old, don't send another
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      if (existingVerification.createdAt > oneMinuteAgo) {
        return res.status(429).json({
          message: 'Please wait before requesting another verification code',
          retryAfter: 60
        });
      }
      
      // Remove existing verification to create a new one
      await EmailVerification.deleteOne({ _id: existingVerification._id });
    }

    // Generate verification code
    const verificationCode = emailService.generateVerificationCode();
    
    // Create new verification record
    const emailVerification = new EmailVerification({
      email: trimmedEmail,
      verificationCode,
      type: 'registration'
    });
    
    await emailVerification.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(trimmedEmail, verificationCode, student.full_name);
      
      res.json({
        message: 'Verification code sent to your email',
        email: trimmedEmail
      });
    } catch (emailError) {
      // Clean up verification record if email failed
      await EmailVerification.deleteOne({ _id: emailVerification._id });
      
      logger.error('Failed to send verification email:', emailError);
      res.status(500).json({
        message: 'Failed to send verification email. Please try again.'
      });
    }

  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({
      message: 'Error sending verification code'
    });
  }
});

// Verify email code (Step 1.5 of registration)
router.post('/verify-email-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: 'Please provide email and verification code'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    // Find active verification
    const verification = await EmailVerification.findActiveVerification(trimmedEmail, 'registration');
    
    if (!verification) {
      return res.status(400).json({
        message: 'No active verification found. Please request a new code.'
      });
    }

    // Check if expired
    if (verification.isExpired()) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return res.status(400).json({
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    // Check if max attempts reached
    if (verification.hasMaxAttemptsReached()) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return res.status(429).json({
        message: 'Maximum verification attempts exceeded. Please request a new code.'
      });
    }

    // Increment attempts
    verification.attempts += 1;

    // Check if code matches
    if (verification.verificationCode !== trimmedCode) {
      await verification.save();
      
      const remainingAttempts = 5 - verification.attempts;
      return res.status(400).json({
        message: `Invalid verification code. ${remainingAttempts} attempts remaining.`
      });
    }

    // Mark as verified
    verification.isVerified = true;
    await verification.save();

    // Get student data for next step
    const student = await Student.findOne({ 
      email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') }
    });

    res.json({
      message: 'Email verified successfully',
      studentData: {
        email: student.email,
        fullname: student.full_name,
        studentId: student.student_id
      }
    });

  } catch (error) {
    console.error('Verify email code error:', error);
    res.status(500).json({
      message: 'Error verifying email code'
    });
  }
});

// Resend verification code
router.post('/resend-verification-code', async (req, res) => {
  try {
    const { email, type = 'registration' } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Please provide an email'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (type === 'registration') {
      // Check if email exists in students collection for registration
      const student = await Student.findOne({ 
        email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') }
      });
      if (!student) {
        return res.status(400).json({
          message: 'Please use your university email'
        });
      }
    } else if (type === 'password_reset') {
      // Check if user exists for password reset
      const user = await User.findOne({ 
        email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') }
      });
      if (!user) {
        return res.status(400).json({
          message: 'No account found with this email address'
        });
      }
    }

    // Check for existing verification
    const existingVerification = await EmailVerification.findActiveVerification(trimmedEmail, type);
    
    if (existingVerification) {
      // Check if we can resend (30 seconds cooldown)
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      if (existingVerification.createdAt > thirtySecondsAgo) {
        return res.status(429).json({
          message: 'Please wait 30 seconds before requesting another code',
          retryAfter: 30
        });
      }
      
      // Remove existing verification
      await EmailVerification.deleteOne({ _id: existingVerification._id });
    }

    // Generate new verification code
    const verificationCode = emailService.generateVerificationCode();
    
    // Create new verification record
    const emailVerification = new EmailVerification({
      email: trimmedEmail,
      verificationCode,
      type
    });
    
    await emailVerification.save();

    // Send appropriate email based on type
    try {
      if (type === 'registration') {
        const student = await Student.findOne({ 
          email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') }
        });
        await emailService.sendVerificationEmail(trimmedEmail, verificationCode, student.full_name);
      } else if (type === 'password_reset') {
        const user = await User.findOne({ 
          email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') }
        });
        await emailService.sendPasswordResetEmail(trimmedEmail, verificationCode, user.fullname);
      }
      
      res.json({
        message: `New ${type === 'password_reset' ? 'password reset' : 'verification'} code sent to your email`
      });
    } catch (emailError) {
      // Clean up verification record if email failed
      await EmailVerification.deleteOne({ _id: emailVerification._id });
      
      logger.error(`Failed to resend ${type} email:`, emailError);
      res.status(500).json({
        message: 'Failed to send verification email. Please try again.'
      });
    }

  } catch (error) {
    console.error('Resend verification code error:', error);
    res.status(500).json({
      message: 'Error resending verification code'
    });
  }
});

// Send password reset code
router.post('/send-password-reset-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Please provide an email'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') }
    });
    if (!user) {
      return res.status(400).json({
        message: 'No account found with this email address'
      });
    }

    // Check for existing verification that hasn't expired
    let existingVerification = await EmailVerification.findActiveVerification(trimmedEmail, 'password_reset');
    
    if (existingVerification) {
      // If there's an active verification less than 1 minute old, don't send another
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      if (existingVerification.createdAt > oneMinuteAgo) {
        return res.status(429).json({
          message: 'Please wait before requesting another reset code',
          retryAfter: 60
        });
      }
      
      // Remove existing verification to create a new one
      await EmailVerification.deleteOne({ _id: existingVerification._id });
    }

    // Generate verification code
    const verificationCode = emailService.generateVerificationCode();
    
    // Create new verification record
    const emailVerification = new EmailVerification({
      email: trimmedEmail,
      verificationCode,
      type: 'password_reset'
    });
    
    await emailVerification.save();

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(trimmedEmail, verificationCode, user.fullname);
      
      res.json({
        message: 'Password reset code sent to your email',
        email: trimmedEmail
      });
    } catch (emailError) {
      // Clean up verification record if email failed
      await EmailVerification.deleteOne({ _id: emailVerification._id });
      
      logger.error('Failed to send password reset email:', emailError);
      res.status(500).json({
        message: 'Failed to send password reset email. Please try again.'
      });
    }

  } catch (error) {
    console.error('Send password reset code error:', error);
    res.status(500).json({
      message: 'Error sending password reset code'
    });
  }
});

// Verify password reset code
router.post('/verify-password-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: 'Please provide email and verification code'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    // Find active verification
    const verification = await EmailVerification.findActiveVerification(trimmedEmail, 'password_reset');
    
    if (!verification) {
      return res.status(400).json({
        message: 'No active password reset found. Please request a new code.'
      });
    }

    // Check if expired
    if (verification.isExpired()) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return res.status(400).json({
        message: 'Reset code has expired. Please request a new code.'
      });
    }

    // Check if max attempts reached
    if (verification.hasMaxAttemptsReached()) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return res.status(429).json({
        message: 'Maximum verification attempts exceeded. Please request a new code.'
      });
    }

    // Increment attempts
    verification.attempts += 1;

    // Check if code matches
    if (verification.verificationCode !== trimmedCode) {
      await verification.save();
      
      const remainingAttempts = 5 - verification.attempts;
      return res.status(400).json({
        message: `Invalid verification code. ${remainingAttempts} attempts remaining.`
      });
    }

    // Mark as verified
    verification.isVerified = true;
    await verification.save();

    res.json({
      message: 'Reset code verified successfully',
      resetToken: verification._id // Use verification ID as temporary reset token
    });

  } catch (error) {
    console.error('Verify password reset code error:', error);
    res.status(500).json({
      message: 'Error verifying reset code'
    });
  }
});

// Reset password with verified code
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        message: 'Please provide email, reset token, and new password'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Find the verified reset verification
    const verification = await EmailVerification.findOne({
      _id: resetToken,
      email: trimmedEmail,
      type: 'password_reset',
      isVerified: true,
      expiresAt: { $gt: new Date() }
    });

    if (!verification) {
      return res.status(400).json({
        message: 'Invalid or expired reset token. Please start the reset process again.'
      });
    }

    // Find the user
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') }
    });

    if (!user) {
      return res.status(400).json({
        message: 'User not found'
      });
    }

    // Validate new password (reuse validation from registration)
    if (newPassword.length < 8 || newPassword.length > 16) {
      return res.status(400).json({
        message: 'Password must be between 8-16 characters long'
      });
    }
    
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
    
    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
      return res.status(400).json({
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol'
      });
    }

    // Update user password (the User model should handle hashing)
    user.password = newPassword;
    await user.save();

    // Clean up verification record
    await EmailVerification.deleteOne({ _id: verification._id });

    res.json({
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'Error resetting password'
    });
  }
});

// Firebase Google authentication
router.post('/google', async (req, res) => {
  try {
    const { idToken, email, name, firebaseUid } = req.body;

    if (!idToken || !email || !name || !firebaseUid) {
      return res.status(400).json({
        message: 'Please provide idToken, email, name, and firebaseUid'
      });
    }

    // Verify Firebase ID token
    const { auth } = require('../config/firebase');
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      return res.status(401).json({
        message: 'Invalid Firebase token'
      });
    }

    // Ensure the token belongs to the same user
    if (decodedToken.uid !== firebaseUid || decodedToken.email !== email) {
      return res.status(401).json({
        message: 'Token verification failed'
      });
    }

    // Check if email exists in students collection (case insensitive)
    const student = await Student.findOne({ 
      email: { $regex: new RegExp(`^${email.trim()}$`, 'i') }
    });
    if (!student) {
      return res.status(400).json({
        message: 'Please use your university email'
      });
    }

    // Check if user already exists (case insensitive)
    let user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email.trim()}$`, 'i') }
    });
    
    if (user) {
      // Update user with Firebase UID if not already set
      if (!user.firebaseUid) {
        user.firebaseUid = firebaseUid;
        await user.save();
      }

      // User exists, proceed with login
      const token = user.getSignedJwtToken();
      
      res.json({
        token,
        user: {
          id: user._id,
          nickname: user.nickname,
          fullname: user.fullname,
          email: user.email,
          studentId: user.studentId,
          university: user.university,
          points: user.points,
          treesPlanted: user.treesPlanted
        },
        action: 'login'
      });
    } else {
      // User doesn't exist, return student data for registration step 2
      res.json({
        studentData: {
          email: student.email,
          fullname: student.full_name,
          studentId: student.student_id,
          firebaseUid: firebaseUid
        },
        action: 'register'
      });
    }
  } catch (error) {
    console.error('Firebase Google authentication error:', error);
    res.status(500).json({
      message: 'Error in Firebase Google authentication'
    });
  }
});

// Register user (Step 2 of registration)
router.post('/register', async (req, res) => {
  try {
    const { email, password, nickname, university, firebaseUid } = req.body;

    if (!email || !password || !nickname || !university) {
      return res.status(400).json({
        message: 'Please provide all required fields'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user already exists (case insensitive)
    let user = await User.findOne({ 
      email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') }
    });
    if (user) {
      return res.status(400).json({
        message: 'User already exists'
      });
    }

    // Verify that email verification was completed
    const verification = await EmailVerification.findOne({
      email: trimmedEmail,
      isVerified: true
    });
    
    if (!verification) {
      return res.status(400).json({
        message: 'Email verification required. Please verify your email first.'
      });
    }

    // Get student data from students collection (case insensitive)
    const student = await Student.findOne({ 
      email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') }
    });
    if (!student) {
      return res.status(400).json({
        message: 'Invalid email. Please verify your email first.'
      });
    }

    // Create user with data from students collection
    user = new User({
      email: student.email,
      password,
      nickname,
      fullname: student.full_name,
      studentId: student.student_id,
      university,
      firebaseUid: firebaseUid || null // Optional Firebase UID
    });

    await user.save();

    // Clean up verification record after successful registration
    await EmailVerification.deleteOne({ _id: verification._id });

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user.email, user.fullname, user.nickname)
      .catch(error => {
        logger.error('Failed to send welcome email:', error);
      });

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      token,
      user: {
        id: user._id,
        nickname: user.nickname,
        fullname: user.fullname,
        email: user.email,
        studentId: user.studentId,
        university: user.university,
        points: user.points,
        treesPlanted: user.treesPlanted
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Error in user registration'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide an email and password'
      });
    }

    // Check for user (case insensitive email)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email.trim()}$`, 'i') }
    }).select('+password');
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = user.getSignedJwtToken();

    res.json({
      token,
      user: {
        id: user._id,
        nickname: user.nickname,
        fullname: user.fullname,
        email: user.email,
        points: user.points,
        treesPlanted: user.treesPlanted
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Error in user login'
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Error getting user data'
    });
  }
});

// Admin Login
router.post('/admin/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Check if admin exists
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: admin._id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.json({
        success: true,
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

module.exports = router; 