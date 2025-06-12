const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');

// Load environment variables from the correct path
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function migrateUserFields() {
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

    // Find all users that have the old 'name' field but not the new fields
    const usersToMigrate = await User.find({
      name: { $exists: true },
      $or: [
        { nickname: { $exists: false } },
        { fullname: { $exists: false } }
      ]
    });

    console.log(`Found ${usersToMigrate.length} users to migrate`);

    if (usersToMigrate.length === 0) {
      console.log('No users need migration');
      return;
    }

    // Migrate each user
    for (const user of usersToMigrate) {
      try {
        const updates = {};
        
        // If nickname doesn't exist, create one from the first part of name
        if (!user.nickname) {
          updates.nickname = user.name.split(' ')[0].toLowerCase();
        }
        
        // If fullname doesn't exist, use the existing name
        if (!user.fullname) {
          updates.fullname = user.name;
        }

        await User.findByIdAndUpdate(user._id, updates);
        console.log(`Migrated user: ${user.email}`);
      } catch (error) {
        console.error(`Failed to migrate user ${user.email}:`, error.message);
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateUserFields()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = migrateUserFields; 