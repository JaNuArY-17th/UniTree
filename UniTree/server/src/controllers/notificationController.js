const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Get all notifications for a user with pagination
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    console.log('Getting notifications for user:', userId);

    // Get notifications with pagination
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalNotifications = await Notification.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalNotifications / limit);

    // Get unread count
    const unreadCount = await Notification.countDocuments({ 
      user: userId, 
      read: false 
    });

    console.log(`Found ${notifications.length} notifications for user`);

    res.json({
      success: true,
      notifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalNotifications,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    logger.error('Get notifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications',
      error: error.message 
    });
  }
};

// Get unread notifications count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    
    const count = await Notification.countDocuments({ 
      user: userId, 
      read: false 
    });

    console.log(`User ${userId} has ${count} unread notifications`);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    logger.error('Get unread count error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get unread count',
      error: error.message 
    });
  }
};

// Mark a specific notification as read
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const notificationId = req.params.id;

    // Validate ObjectId format
    if (!isValidObjectId(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format'
      });
    }

    console.log(`Marking notification ${notificationId} as read for user ${userId}`);

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    logger.error('Mark as read error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as read',
      error: error.message 
    });
  }
};

// Mark all notifications as read for a user
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    console.log(`Marking all notifications as read for user ${userId}`);

    const result = await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    logger.error('Mark all as read error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark all notifications as read',
      error: error.message 
    });
  }
};

// Create a new notification (typically called by system/admin)
const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, data } = req.body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, type, title, message'
      });
    }

    // Validate notification type
    const validTypes = [
      'ACHIEVEMENT_UNLOCKED',
      'TREE_HEALTH_WARNING',
      'POINTS_MILESTONE',
      'TREE_GROWTH'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`Creating notification for user ${userId}: ${type}`);

    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      data: data || {}
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    logger.error('Create notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create notification',
      error: error.message 
    });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const notificationId = req.params.id;

    // Validate ObjectId format
    if (!isValidObjectId(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format'
      });
    }

    console.log(`Deleting notification ${notificationId} for user ${userId}`);

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    logger.error('Delete notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notification',
      error: error.message 
    });
  }
};

// Helper function to create notifications (for use by other parts of the system)
const createNotificationHelper = async (userId, type, title, message, data = {}) => {
  try {
    console.log(`Creating system notification for user ${userId}: ${type}`);
    
    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      data
    });

    await notification.save();
    console.log('System notification created successfully');
    return notification;
  } catch (error) {
    console.error('Create system notification error:', error);
    logger.error('Create system notification error:', error);
    throw error;
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
  createNotificationHelper
}; 