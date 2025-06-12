const mongoose = require('mongoose');

async function checkLocalDatabase() {
    try {
        console.log('🔍 Checking local database...');
        
        // Connect to local MongoDB
        await mongoose.connect('mongodb://localhost:27017/unitree', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ Connected to local database');
        
        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📁 Collections found:');
        
        if (collections.length === 0) {
            console.log('   No collections found - database might be empty');
        } else {
            for (const collection of collections) {
                const count = await mongoose.connection.db.collection(collection.name).countDocuments();
                console.log(`   - ${collection.name}: ${count} documents`);
            }
        }
        
        // Show sample data from each collection
        console.log('\n📄 Sample data:');
        for (const collection of collections) {
            if (collection.name) {
                const sample = await mongoose.connection.db.collection(collection.name).findOne();
                console.log(`\n${collection.name}:`);
                console.log(JSON.stringify(sample, null, 2));
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('💡 Make sure MongoDB is running locally');
            console.log('   Try: mongod or start your MongoDB service');
        }
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from database');
    }
}

checkLocalDatabase(); 