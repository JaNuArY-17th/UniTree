const mongoose = require('mongoose');
const fs = require('fs').promises;

// Connection strings
const LOCAL_URI = 'mongodb://localhost:27017/unitree';
const ATLAS_URI = 'mongodb+srv://Greenity:greenityclub2204@cluster0.epzjlse.mongodb.net/unitree?retryWrites=true&w=majority&appName=Cluster0';

async function migrateDatabase() {
    console.log('🚀 Starting database migration...');
    
    if (ATLAS_URI === 'YOUR_ATLAS_CONNECTION_STRING_HERE') {
        console.log('❌ Please update ATLAS_URI in this script with your MongoDB Atlas connection string');
        console.log('💡 Get it from: MongoDB Atlas → Connect → Connect your application');
        return;
    }

    let localConnection, atlasConnection;
    
    try {
        // Connect to local database
        console.log('🔗 Connecting to local database...');
        localConnection = await mongoose.createConnection(LOCAL_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to local database');

        // Connect to Atlas
        console.log('🔗 Connecting to MongoDB Atlas...');
        atlasConnection = await mongoose.createConnection(ATLAS_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB Atlas');

        // Get the actual database objects
        const localDb = localConnection.useDb('unitree');
        const atlasDb = atlasConnection.useDb('unitree');
        
        // Get collections from local database
        const collections = await localDb.listCollections().toArray();
        console.log(`📁 Found ${collections.length} collections to migrate`);

        // Migrate each collection
        for (const collection of collections) {
            const collectionName = collection.name;
            console.log(`\n📦 Migrating collection: ${collectionName}`);
            
            // Get all documents from local collection
            const documents = await localDb.collection(collectionName).find({}).toArray();
            console.log(`   Found ${documents.length} documents`);
            
            if (documents.length > 0) {
                try {
                    // Clear existing data in Atlas collection (optional)
                    await atlasDb.collection(collectionName).deleteMany({});
                    
                    // Insert into Atlas
                    await atlasDb.collection(collectionName).insertMany(documents);
                    console.log(`   ✅ Migrated ${documents.length} documents`);
                } catch (insertError) {
                    console.log(`   ❌ Error migrating ${collectionName}:`, insertError.message);
                }
            } else {
                console.log(`   ⚠️  Collection is empty, skipping`);
            }
        }

        console.log('\n🎉 Migration completed successfully!');
        console.log('\n📊 Migration Summary:');
        
        // Verify migration
        for (const collection of collections) {
            const localCount = await localDb.collection(collection.name).countDocuments();
            const atlasCount = await atlasDb.collection(collection.name).countDocuments();
            console.log(`   ${collection.name}: ${localCount} → ${atlasCount} ${localCount === atlasCount ? '✅' : '❌'}`);
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        
        if (error.message.includes('authentication failed')) {
            console.log('💡 Check your Atlas username and password');
        }
        if (error.message.includes('ECONNREFUSED')) {
            console.log('💡 Make sure your local MongoDB is running');
        }
        if (error.message.includes('IP not in whitelist')) {
            console.log('💡 Add your IP to Atlas network access: 0.0.0.0/0');
        }
    } finally {
        // Close connections
        if (localConnection) {
            await localConnection.close();
            console.log('👋 Local connection closed');
        }
        if (atlasConnection) {
            await atlasConnection.close();
            console.log('👋 Atlas connection closed');
        }
    }
}

// Instructions
console.log(`
🔧 MIGRATION INSTRUCTIONS:

1. Set up MongoDB Atlas:
   - Go to mongodb.com/atlas
   - Create a free cluster
   - Create a database user
   - Whitelist IP: 0.0.0.0/0
   
2. Get your connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   
3. Update this script:
   - Replace ATLAS_URI with your connection string
   - Replace <password> with your database password
   
4. Run migration:
   - node migrate-database.js

Example Atlas URI:
mongodb+srv://username:password@cluster.xxxxx.mongodb.net/unitree?retryWrites=true&w=majority
`);

migrateDatabase(); 