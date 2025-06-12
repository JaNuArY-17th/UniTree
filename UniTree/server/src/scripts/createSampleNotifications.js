// Script to create sample notifications for testing
require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');

const createSampleNotifications = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the first user to create notifications for
    const user = await User.findOne();
    if (!user) {
      console.log('No users found. Please register a user first.');
      return;
    }

    console.log(`Creating sample notifications for user: ${user.fullname} (${user._id})`);

    // Sample notifications
    const sampleNotifications = [
      {
        user: user._id,
        type: 'POINTS_MILESTONE',
        title: 'Points Milestone Reached!',
        message: 'Congratulations! You have earned 500 points.',
        read: false,
        data: { points: 500 }
      },
      {
        user: user._id,
        type: 'TREE_GROWTH',
        title: 'Your Tree is Growing!',
        message: 'Your Oak tree has grown to the Young Tree stage.',
        read: false,
        data: { newStage: 3 } // Remove treeId for now since it needs to be a valid ObjectId
      },
      {
        user: user._id,
        type: 'ACHIEVEMENT_UNLOCKED',
        title: 'Achievement Unlocked!',
        message: 'You have unlocked the "WiFi Warrior" achievement for staying connected for 10 hours.',
        read: true,
        data: {} // Remove achievementId for now since it needs to be a valid ObjectId
      },
      {
        user: user._id,
        type: 'TREE_HEALTH_WARNING',
        title: 'Tree Needs Attention',
        message: 'Your Pine tree health is declining. Stay connected to university WiFi to improve it.',
        read: true,
        data: { healthScore: 25 } // Remove treeId for now since it needs to be a valid ObjectId
      }
    ];

    // Delete existing notifications for this user
    await Notification.deleteMany({ user: user._id });
    console.log('Cleared existing notifications');

    // Create new sample notifications
    const createdNotifications = await Notification.insertMany(sampleNotifications);
    console.log(`Created ${createdNotifications.length} sample notifications`);

    // Display summary
    const unreadCount = await Notification.countDocuments({ user: user._id, read: false });
    console.log(`\nSummary:`);
    console.log(`- Total notifications: ${createdNotifications.length}`);
    console.log(`- Unread notifications: ${unreadCount}`);
    console.log(`- Read notifications: ${createdNotifications.length - unreadCount}`);

    console.log('\nSample notifications created successfully!');
    console.log('You can now test the notification system in your mobile app.');

  } catch (error) {
    console.error('Error creating sample notifications:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
if (require.main === module) {
  createSampleNotifications();
}

module.exports = createSampleNotifications; 