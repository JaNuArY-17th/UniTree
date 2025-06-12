const { createNotificationHelper } = require('../controllers/notificationController');

// Notification templates and triggers
const NotificationTriggers = {
  // Points milestone notifications
  pointsMilestone: async (userId, points) => {
    const milestones = [100, 250, 500, 1000, 2500, 5000, 10000];
    
    if (milestones.includes(points)) {
      await createNotificationHelper(
        userId,
        'POINTS_MILESTONE',
        `${points} Points Milestone!`,
        `Congratulations! You have earned ${points} points. Keep up the great work!`,
        { points }
      );
    }
  },

  // Tree growth notifications
  treeGrowth: async (userId, treeId, newStage, treeName = 'tree') => {
    const stageNames = {
      0: 'Seed',
      1: 'Sprout',
      2: 'Seedling',
      3: 'Young Tree',
      4: 'Mature Tree',
      5: 'Ancient Tree'
    };

    const stageName = stageNames[newStage] || 'next stage';
    
    await createNotificationHelper(
      userId,
      'TREE_GROWTH',
      'Your Tree is Growing!',
      `Great news! Your ${treeName} has grown to the ${stageName} stage. Keep connecting to WiFi to help it grow more!`,
      { treeId, newStage, stageName }
    );
  },

  // Tree health warning notifications
  treeHealthWarning: async (userId, treeId, healthScore, treeName = 'tree') => {
    if (healthScore <= 30) {
      await createNotificationHelper(
        userId,
        'TREE_HEALTH_WARNING',
        'Tree Needs Attention',
        `Your ${treeName} health is declining (${healthScore}%). Connect to university WiFi more regularly to improve its health.`,
        { treeId, healthScore }
      );
    }
  },

  // Achievement unlocked notifications
  achievementUnlocked: async (userId, achievementId, achievementName, description) => {
    await createNotificationHelper(
      userId,
      'ACHIEVEMENT_UNLOCKED',
      'Achievement Unlocked!',
      `Congratulations! You have unlocked the "${achievementName}" achievement. ${description}`,
      { achievementId, achievementName }
    );
  },

  // Welcome notification for new users
  welcomeUser: async (userId, userName) => {
    await createNotificationHelper(
      userId,
      'POINTS_MILESTONE',
      'Welcome to UniTree!',
      `Welcome ${userName}! Start connecting to university WiFi to earn points and plant your first tree. Every hour of connection helps the environment!`,
      { isWelcome: true }
    );
  },

  // First tree planted notification
  firstTreePlanted: async (userId, treeId, treeName) => {
    await createNotificationHelper(
      userId,
      'TREE_GROWTH',
      'Your First Tree is Planted!',
      `Congratulations! You've planted your first ${treeName}. Continue connecting to WiFi to help it grow and contribute to a greener planet!`,
      { treeId, isFirstTree: true }
    );
  }
};

// Batch notification creation (useful for system announcements)
const createBatchNotifications = async (userIds, type, title, message, data = {}) => {
  try {
    const notifications = userIds.map(userId => ({
      user: userId,
      type,
      title,
      message,
      data
    }));

    const Notification = require('../models/Notification');
    await Notification.insertMany(notifications);
    
    console.log(`Created ${notifications.length} batch notifications of type ${type}`);
  } catch (error) {
    console.error('Batch notification creation error:', error);
    throw error;
  }
};

// Check and trigger notifications based on user activity
const checkAndTriggerNotifications = async (userId, activityType, data) => {
  try {
    switch (activityType) {
      case 'POINTS_EARNED':
        await NotificationTriggers.pointsMilestone(userId, data.totalPoints);
        break;
      
      case 'TREE_GROWTH':
        await NotificationTriggers.treeGrowth(
          userId, 
          data.treeId, 
          data.newStage, 
          data.treeName
        );
        break;
      
      case 'TREE_HEALTH_CHECK':
        await NotificationTriggers.treeHealthWarning(
          userId, 
          data.treeId, 
          data.healthScore, 
          data.treeName
        );
        break;
      
      case 'ACHIEVEMENT_EARNED':
        await NotificationTriggers.achievementUnlocked(
          userId,
          data.achievementId,
          data.achievementName,
          data.description
        );
        break;
      
      case 'USER_REGISTERED':
        await NotificationTriggers.welcomeUser(userId, data.userName);
        break;
      
      case 'FIRST_TREE_PLANTED':
        await NotificationTriggers.firstTreePlanted(
          userId,
          data.treeId,
          data.treeName
        );
        break;
      
      default:
        console.log(`Unknown activity type for notifications: ${activityType}`);
    }
  } catch (error) {
    console.error('Check and trigger notifications error:', error);
    // Don't throw error to avoid breaking the main flow
  }
};

module.exports = {
  NotificationTriggers,
  createBatchNotifications,
  checkAndTriggerNotifications
}; 