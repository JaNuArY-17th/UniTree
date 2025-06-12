const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');

// Load environment variables from the correct path
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function migrateTimeTrackingFields() {
  try {
    // Check if MONGODB_URI is available
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set');
      console.log('Please make sure you have a .env file in the server directory with MONGODB_URI defined');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users that don't have the new time tracking fields
    const usersToMigrate = await User.find({
      $or: [
        { totalTimeConnected: { $exists: false } },
        { monthTimeConnected: { $exists: false } },
        { weekTimeConnected: { $exists: false } },
        { dayTimeConnected: { $exists: false } },
        { lastDayReset: { $exists: false } },
        { lastWeekReset: { $exists: false } },
        { lastMonthReset: { $exists: false } }
      ]
    });

    console.log(`Found ${usersToMigrate.length} users to migrate`);

    if (usersToMigrate.length === 0) {
      console.log('No users need migration');
      return;
    }

    const now = new Date();

    // Migrate each user
    for (const user of usersToMigrate) {
      try {
        const updates = {};
        
        // Add time tracking fields if they don't exist
        if (user.totalTimeConnected === undefined) {
          updates.totalTimeConnected = 0;
        }
        if (user.monthTimeConnected === undefined) {
          updates.monthTimeConnected = 0;
        }
        if (user.weekTimeConnected === undefined) {
          updates.weekTimeConnected = 0;
        }
        if (user.dayTimeConnected === undefined) {
          updates.dayTimeConnected = 0;
        }
        
        // Add reset tracking fields if they don't exist
        if (user.lastDayReset === undefined) {
          updates.lastDayReset = now;
        }
        if (user.lastWeekReset === undefined) {
          updates.lastWeekReset = now;
        }
        if (user.lastMonthReset === undefined) {
          updates.lastMonthReset = now;
        }

        await User.findByIdAndUpdate(user._id, updates);
        console.log(`Migrated user: ${user.email}`);
      } catch (error) {
        console.error(`Failed to migrate user ${user.email}:`, error.message);
      }
    }

    console.log('Time tracking fields migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateTimeTrackingFields()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = migrateTimeTrackingFields; 