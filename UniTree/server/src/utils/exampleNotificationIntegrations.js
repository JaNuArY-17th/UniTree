// Example integrations showing how to trigger notifications from other parts of the system
const { checkAndTriggerNotifications } = require('./notificationUtils');

// Example 1: Integration in user registration
const handleUserRegistration = async (userId, userData) => {
  try {
    // ... existing user registration logic ...
    
    // Trigger welcome notification
    await checkAndTriggerNotifications(userId, 'USER_REGISTERED', {
      userName: userData.fullname
    });
    
    console.log('Welcome notification sent to new user');
  } catch (error) {
    console.error('Error in user registration notification:', error);
  }
};

// Example 2: Integration in points system
const updateUserPoints = async (userId, newPoints, previousPoints) => {
  try {
    // ... existing points update logic ...
    
    // Check if user reached a milestone
    await checkAndTriggerNotifications(userId, 'POINTS_EARNED', {
      totalPoints: newPoints,
      pointsEarned: newPoints - previousPoints
    });
    
    console.log('Points milestone notification checked');
  } catch (error) {
    console.error('Error in points notification:', error);
  }
};

// Example 3: Integration in tree planting system
const plantNewTree = async (userId, treeData) => {
  try {
    // ... existing tree planting logic ...
    
    // Check if this is user's first tree
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (user.trees.length === 1) { // First tree
      await checkAndTriggerNotifications(userId, 'FIRST_TREE_PLANTED', {
        treeId: treeData._id,
        treeName: treeData.species
      });
    }
    
    console.log('First tree notification checked');
  } catch (error) {
    console.error('Error in tree planting notification:', error);
  }
};

// Example 4: Integration in tree growth system
const updateTreeGrowth = async (userId, treeId, oldStage, newStage, treeData) => {
  try {
    // ... existing tree growth logic ...
    
    if (newStage > oldStage) {
      await checkAndTriggerNotifications(userId, 'TREE_GROWTH', {
        treeId,
        newStage,
        treeName: treeData.species
      });
    }
    
    console.log('Tree growth notification sent');
  } catch (error) {
    console.error('Error in tree growth notification:', error);
  }
};

// Example 5: Integration in tree health monitoring
const checkTreeHealth = async (userId, treeId, healthScore, treeData) => {
  try {
    // ... existing health check logic ...
    
    if (healthScore <= 30) {
      await checkAndTriggerNotifications(userId, 'TREE_HEALTH_CHECK', {
        treeId,
        healthScore,
        treeName: treeData.species
      });
    }
    
    console.log('Tree health warning checked');
  } catch (error) {
    console.error('Error in tree health notification:', error);
  }
};

// Example 6: Integration in achievements system
const unlockAchievement = async (userId, achievementData) => {
  try {
    // ... existing achievement unlock logic ...
    
    await checkAndTriggerNotifications(userId, 'ACHIEVEMENT_EARNED', {
      achievementId: achievementData._id,
      achievementName: achievementData.name,
      description: achievementData.description
    });
    
    console.log('Achievement notification sent');
  } catch (error) {
    console.error('Error in achievement notification:', error);
  }
};

// How to use these in your existing code:
/*

// In your auth routes (register):
router.post('/register', async (req, res) => {
  try {
    // ... create user logic ...
    
    // Send welcome notification
    await handleUserRegistration(newUser._id, { fullname: newUser.fullname });
    
    res.json({ success: true, user: newUser });
  } catch (error) {
    // ... error handling ...
  }
});

// In your points routes:
router.post('/update-points', async (req, res) => {
  try {
    const user = await User.findById(userId);
    const previousPoints = user.points;
    
    // ... update points logic ...
    
    await updateUserPoints(userId, user.points, previousPoints);
    
    res.json({ success: true, points: user.points });
  } catch (error) {
    // ... error handling ...
  }
});

// In your tree routes:
router.post('/redeem', async (req, res) => {
  try {
    // ... tree creation logic ...
    
    await plantNewTree(userId, newTree);
    
    res.json({ success: true, tree: newTree });
  } catch (error) {
    // ... error handling ...
  }
});

*/

module.exports = {
  handleUserRegistration,
  updateUserPoints,
  plantNewTree,
  updateTreeGrowth,
  checkTreeHealth,
  unlockAchievement
}; 