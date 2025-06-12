const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');

// Get leaderboard rankings
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    // Get all users ordered by points (descending)
    const users = await User.find({})
      .select('nickname fullname email points treesPlanted avatar createdAt')
      .sort({ points: -1, createdAt: 1 }) // Sort by points desc, then by creation date for ties
      .limit(parseInt(limit));

    // Add rank to each user
    const leaderboard = users.map((user, index) => ({
      id: user._id,
      nickname: user.nickname,
      fullname: user.fullname,
      email: user.email,
      points: user.points || 0,
      treesPlanted: user.treesPlanted || 0,
      avatar: user.avatar,
      rank: index + 1,
      createdAt: user.createdAt
    }));

    // Find current user's rank
    const currentUserId = req.user.userId;
    let userRank = null;
    let userInfo = null;

    const currentUserIndex = leaderboard.findIndex(user => user.id.toString() === currentUserId.toString());
    
    if (currentUserIndex >= 0) {
      userRank = currentUserIndex + 1;
      userInfo = leaderboard[currentUserIndex];
    } else {
      // User not in top rankings, find their actual rank
      const totalUsersAbove = await User.countDocuments({
        points: { $gt: req.user.points || 0 }
      });
      
      const currentUser = await User.findById(currentUserId)
        .select('nickname fullname email points treesPlanted avatar createdAt');
      
      if (currentUser) {
        userRank = totalUsersAbove + 1;
        userInfo = {
          id: currentUser._id,
          nickname: currentUser.nickname,
          fullname: currentUser.fullname,
          email: currentUser.email,
          points: currentUser.points || 0,
          treesPlanted: currentUser.treesPlanted || 0,
          avatar: currentUser.avatar,
          rank: userRank,
          createdAt: currentUser.createdAt
        };
      }
    }

    logger.info('Leaderboard fetched:', { 
      userId: currentUserId, 
      userRank, 
      totalUsers: leaderboard.length 
    });

    res.json({
      leaderboard,
      userRank,
      userInfo,
      totalUsers: await User.countDocuments({}),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's specific rank and nearby users
router.get('/user-rank', auth, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { range = 5 } = req.query; // Number of users above and below to show
    
    // Get current user
    const currentUser = await User.findById(currentUserId)
      .select('nickname fullname email points treesPlanted avatar createdAt');
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Count users with higher points
    const usersAbove = await User.countDocuments({
      points: { $gt: currentUser.points || 0 }
    });
    
    const userRank = usersAbove + 1;

    // Get users around current user's rank
    const nearbyUsers = await User.find({})
      .select('nickname fullname email points treesPlanted avatar createdAt')
      .sort({ points: -1, createdAt: 1 })
      .skip(Math.max(0, userRank - range - 1))
      .limit(range * 2 + 1);

    // Add ranks to nearby users
    const startRank = Math.max(1, userRank - range);
    const nearbyLeaderboard = nearbyUsers.map((user, index) => ({
      id: user._id,
      nickname: user.nickname,
      fullname: user.fullname,
      email: user.email,
      points: user.points || 0,
      treesPlanted: user.treesPlanted || 0,
      avatar: user.avatar,
      rank: startRank + index,
      isCurrentUser: user._id.toString() === currentUserId.toString(),
      createdAt: user.createdAt
    }));

    logger.info('User rank fetched:', { 
      userId: currentUserId, 
      userRank, 
      nearbyUsers: nearbyLeaderboard.length 
    });

    res.json({
      userRank,
      userInfo: {
        id: currentUser._id,
        nickname: currentUser.nickname,
        fullname: currentUser.fullname,
        email: currentUser.email,
        points: currentUser.points || 0,
        treesPlanted: currentUser.treesPlanted || 0,
        avatar: currentUser.avatar,
        rank: userRank,
        createdAt: currentUser.createdAt
      },
      nearbyUsers: nearbyLeaderboard,
      totalUsers: await User.countDocuments({}),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Get user rank error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 