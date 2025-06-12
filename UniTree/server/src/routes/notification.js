const express = require('express');
const router = express.Router();
const { auth, authAdmin } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification
} = require('../controllers/notificationController');

// @route   GET /api/notifications
// @desc    Get all notifications for authenticated user with pagination
// @access  Private
router.get('/', auth, getNotifications);

// @route   GET /api/notifications/unread-count
// @desc    Get unread notifications count for authenticated user
// @access  Private
router.get('/unread-count', auth, getUnreadCount);

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a specific notification as read
// @access  Private
router.patch('/:id/read', auth, markAsRead);

// @route   PATCH /api/notifications/mark-all-read
// @desc    Mark all notifications as read for authenticated user
// @access  Private
router.patch('/mark-all-read', auth, markAllAsRead);

// @route   POST /api/notifications
// @desc    Create a new notification (admin use or system calls)
// @access  Admin Only - SECURITY FIX
router.post('/', authAdmin, createNotification);

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', auth, deleteNotification);

// @route   POST /api/notifications/subscribe
// @desc    Subscribe to push notifications (placeholder - implement with push service)
// @access  Private
router.post('/subscribe', auth, (req, res) => {
  // TODO: Implement push notification subscription
  res.json({
    success: true,
    message: 'Push notification subscription endpoint - not implemented yet',
    pushToken: req.body.pushToken
  });
});

// @route   POST /api/notifications/unsubscribe
// @desc    Unsubscribe from push notifications (placeholder - implement with push service)
// @access  Private
router.post('/unsubscribe', auth, (req, res) => {
  // TODO: Implement push notification unsubscription
  res.json({
    success: true,
    message: 'Push notification unsubscription endpoint - not implemented yet'
  });
});

module.exports = router; 