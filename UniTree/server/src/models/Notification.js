const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'ACHIEVEMENT_UNLOCKED',
      'TREE_HEALTH_WARNING',
      'POINTS_MILESTONE',
      'ATTENDANCE_REMINDER',
      'TREE_GROWTH'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  data: {
    achievementId: mongoose.Schema.Types.ObjectId,
    treeId: mongoose.Schema.Types.ObjectId,
    points: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema); 