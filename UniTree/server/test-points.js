const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const WifiSession = require('./src/models/WifiSession');
const Point = require('./src/models/Point');

async function testPointsSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create test user
    const testUser = await User.create({
      email: 'test@test.com',
      password: 'Password123!',
      nickname: 'testuser',
      fullname: 'Test User',
      studentId: 'STU001',
      university: 'Hanoi',
      points: 0
    });
    console.log('Test user created:', testUser._id);

    // Test 1: Create a 2.5 hour session (should award 200 points for 2 complete hours)
    console.log('\n--- Test 1: 2.5 hour session ---');
    
    const sessionStart = new Date(Date.now() - (2.5 * 60 * 60 * 1000)); // 2.5 hours ago
    const sessionEnd = new Date();
    
    const session = new WifiSession({
      user: testUser._id,
      ssid: 'University_WiFi',
      startTime: sessionStart,
      endTime: sessionEnd
    });

    // Calculate points (same logic as server)
    const durationMinutes = (sessionEnd - sessionStart) / (1000 * 60);
    const completeHours = Math.floor(durationMinutes / 60);
    const pointsToAward = completeHours * 100;

    session.pointsAwarded = pointsToAward;
    await session.save();

    // Award points to user
    await User.findByIdAndUpdate(testUser._id, { $inc: { points: pointsToAward } });

    // Create point record
    const pointRecord = new Point({
      userId: testUser._id,
      amount: pointsToAward,
      type: 'ATTENDANCE',
      description: `${completeHours} hour(s) of university WiFi attendance`,
      metadata: {
        sessionId: session._id,
        startTime: sessionStart,
        endTime: sessionEnd,
        hoursAwarded: completeHours
      }
    });
    await pointRecord.save();

    console.log(`Session duration: ${Math.floor(durationMinutes)} minutes`);
    console.log(`Complete hours: ${completeHours}`);
    console.log(`Points awarded: ${pointsToAward}`);

    // Test 2: Create a 45-minute session (should award 0 points)
    console.log('\n--- Test 2: 45-minute session ---');
    
    const shortSessionStart = new Date(Date.now() - (45 * 60 * 1000)); // 45 minutes ago
    const shortSessionEnd = new Date();
    
    const shortSession = new WifiSession({
      user: testUser._id,
      ssid: 'University_WiFi',
      startTime: shortSessionStart,
      endTime: shortSessionEnd
    });

    const shortDurationMinutes = (shortSessionEnd - shortSessionStart) / (1000 * 60);
    const shortCompleteHours = Math.floor(shortDurationMinutes / 60);
    const shortPointsToAward = shortCompleteHours * 100;

    shortSession.pointsAwarded = shortPointsToAward;
    await shortSession.save();

    console.log(`Short session duration: ${Math.floor(shortDurationMinutes)} minutes`);
    console.log(`Complete hours: ${shortCompleteHours}`);
    console.log(`Points awarded: ${shortPointsToAward}`);

    // Check final user points
    const updatedUser = await User.findById(testUser._id);
    console.log(`\nFinal user points: ${updatedUser.points}`);

    // Check point records
    const userPoints = await Point.find({ userId: testUser._id });
    console.log(`\nPoint records created: ${userPoints.length}`);
    userPoints.forEach((point, index) => {
      console.log(`  ${index + 1}. ${point.amount} points - ${point.description}`);
    });

    // Cleanup
    await User.findByIdAndDelete(testUser._id);
    await WifiSession.deleteMany({ user: testUser._id });
    await Point.deleteMany({ userId: testUser._id });
    console.log('\nTest data cleaned up');

    console.log('\n✅ Points system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testPointsSystem(); 