const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

// Available predefined avatars (should match the mobile app configuration)
const VALID_AVATARS = [
  'fox', 'owl', 'panda', 'lion', 'elephant', 'penguin',
  'tree', 'flower', 'mountain', 'ocean', 'sun', 'moon',
  'geometric_blue', 'geometric_purple', 'geometric_green', 'geometric_orange',
  'robot', 'astronaut', 'artist', 'scientist'
];

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile (only nickname allowed)
router.put('/profile', auth, async (req, res) => {
  try {
    const { nickname } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow nickname updates in personal information
    if (nickname) {
      user.nickname = nickname;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }

    // Get user with password
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordCorrect = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Validate new password format
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

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user points
router.get('/points', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('points');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ points: user.points });
  } catch (error) {
    logger.error('Get points error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's trees
router.get('/trees', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('trees')
      .select('trees');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ trees: user.trees });
  } catch (error) {
    logger.error('Get trees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notification settings
router.get('/notification-settings', auth, async (req, res) => {
  try {
    console.log('GET /notification-settings');
    console.log('Auth user:', req.user);
    console.log('User ID:', req.user.userId || req.user._id);
    
    const userId = req.user.userId || req.user._id;
    const user = await User.findById(userId).select('notificationSettings');
    console.log('Found user:', user);
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure we have default settings if none exist
    const settings = user.notificationSettings || {
      treeHealth: true,
      achievements: true,
      attendance: true
    };
    
    console.log('Returning settings:', settings);
    res.json(settings);
  } catch (error) {
    console.error('Get notification settings error:', error);
    logger.error('Get notification settings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update notification settings
router.put('/notification-settings', auth, async (req, res) => {
  try {
    console.log('PUT /notification-settings');
    console.log('Auth user:', req.user);
    console.log('User ID:', req.user.userId || req.user._id);
    console.log('Request body:', req.body);
    
    const { settings } = req.body;
    if (!settings) {
      return res.status(400).json({ message: 'Settings object is required' });
    }

    const userId = req.user.userId || req.user._id;
    const user = await User.findById(userId);
    console.log('Found user:', user);
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure we maintain the structure
    user.notificationSettings = {
      ...user.notificationSettings,
      ...settings
    };

    console.log('Updated settings:', user.notificationSettings);
    await user.save();
    res.json(user.notificationSettings);
  } catch (error) {
    console.error('Update notification settings error:', error);
    logger.error('Update notification settings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Set user avatar (predefined avatar selection)
router.put('/avatar', auth, async (req, res) => {
  try {
    const { avatarId } = req.body;

    // Validate avatar ID
    if (!avatarId || !VALID_AVATARS.includes(avatarId)) {
      return res.status(400).json({ 
        message: 'Invalid avatar ID. Please select a valid predefined avatar.',
        validAvatars: VALID_AVATARS 
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user with new avatar ID
    user.avatar = avatarId;
    await user.save();

    res.json({
      message: 'Avatar updated successfully',
      avatar: avatarId
    });
  } catch (error) {
    logger.error('Avatar update error:', error);
    res.status(500).json({ message: 'Server error during avatar update' });
  }
});

// Get available avatars
router.get('/avatars', (req, res) => {
  try {
    res.json({
      message: 'Available predefined avatars',
      avatars: VALID_AVATARS
    });
  } catch (error) {
    logger.error('Get avatars error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 