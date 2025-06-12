require('dotenv').config();
const mongoose = require('mongoose');
const { seedTreeTypes } = require('../seeders/treeTypes');

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    console.log('Starting database seeding...');
    
    // Seed tree types
    const treeTypesSeeded = await seedTreeTypes();
    
    if (treeTypesSeeded) {
      console.log('✅ Database seeding completed successfully!');
    } else {
      console.log('❌ Database seeding failed');
    }
    
  } catch (error) {
    console.error('Database seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase }; 