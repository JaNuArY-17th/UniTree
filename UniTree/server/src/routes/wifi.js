const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const WifiSession = require('../models/WifiSession');
const User = require('../models/User');
const Tree = require('../models/Tree');
const Point = require('../models/Point');
const logger = require('../utils/logger');

// Environment configuration
const UNIVERSITY_BSSID = process.env.WIFI_BSSID;
const POINTS_PER_HOUR = parseInt(process.env.POINTS_PER_HOUR) || 100;

// Helper function to get first 8 digits of BSSID (e.g., "c2:74:ad:1d" from "c2:74:ad:1d:e5:47")
const getFirstEightDigitsOfBSSID = (bssid) => {
  if (!bssid || typeof bssid !== 'string') return null;
  const parts = bssid.split(':');
  if (parts.length < 4) return null;
  return parts.slice(0, 4).join(':');
};

// Helper function to calculate complete hours from minutes
const calculateCompleteHours = (minutes) => Math.floor(minutes / 60);

// Helper function to calculate stats for a time period
const calculateStats = (sessions) => {
  const totalDuration = sessions.reduce((acc, session) => {
    const start = session.startTime;
    const end = session.endTime || new Date();
    return acc + ((end - start) / (1000 * 60 * 60)); // Convert to hours
  }, 0);

  const totalPoints = sessions.reduce((acc, session) => {
    return acc + (session.pointsAwarded || 0);
  }, 0);

  return {
    duration: Math.round(totalDuration * 10) / 10, // Round to 1 decimal place
    points: totalPoints
  };
};

// Get WiFi statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check and reset time periods if needed
    await user.checkAndResetTimePeriods();

    // Convert minutes to hours for display
    const stats = {
      today: {
        duration: Math.round((user.dayTimeConnected / 60) * 10) / 10, // Round to 1 decimal
        points: Math.floor(user.dayTimeConnected / 60) * POINTS_PER_HOUR
      },
      week: {
        duration: Math.round((user.weekTimeConnected / 60) * 10) / 10,
        points: Math.floor(user.weekTimeConnected / 60) * POINTS_PER_HOUR
      },
      month: {
        duration: Math.round((user.monthTimeConnected / 60) * 10) / 10,
        points: Math.floor(user.monthTimeConnected / 60) * POINTS_PER_HOUR
      },
      total: {
        duration: Math.round((user.totalTimeConnected / 60) * 10) / 10,
        points: Math.floor(user.totalTimeConnected / 60) * POINTS_PER_HOUR
      }
    };

    res.json(stats);
  } catch (error) {
    logger.error('Get WiFi stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start WiFi session
router.post('/start', auth, async (req, res) => {
  try {
    const { ssid, bssid } = req.body;

    const currentBSSIDPrefix = getFirstEightDigitsOfBSSID(bssid);
    const expectedBSSIDPrefix = getFirstEightDigitsOfBSSID(UNIVERSITY_BSSID);

    logger.info('Starting WiFi session:', { 
      userId: req.user.userId, 
      ssid,
      bssid,
      currentBSSIDPrefix,
      expectedBssid: UNIVERSITY_BSSID,
      expectedBSSIDPrefix
    });

    // Validate university WiFi using first 8 digits of BSSID only
    if (currentBSSIDPrefix !== expectedBSSIDPrefix) {
      logger.warn('Invalid WiFi BSSID prefix:', { 
        received: bssid, 
        receivedPrefix: currentBSSIDPrefix,
        expected: UNIVERSITY_BSSID,
        expectedPrefix: expectedBSSIDPrefix
      });
      return res.status(400).json({ message: 'Invalid university WiFi network (BSSID prefix mismatch)' });
    }

    // Check for active session
    let activeSession = await WifiSession.findOne({
      user: req.user.userId,
      endTime: null,
    });

    if (activeSession) {
      return res.status(400).json({ message: 'Active session already exists' });
    }

    // Create new session
    const session = new WifiSession({
      user: req.user.userId,
      ssid,
      bssid,
      startTime: new Date(),
    });

    await session.save();
    logger.info('WiFi session started:', { sessionId: session._id, userId: req.user.userId });
    res.json(session);
  } catch (error) {
    logger.error('Start WiFi session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// End WiFi session and award remaining points
router.post('/end', auth, async (req, res) => {
  try {
    const session = await WifiSession.findOne({
      user: req.user.userId,
      endTime: null,
    });

    if (!session) {
      return res.status(404).json({ message: 'No active session found' });
    }

    const endTime = new Date();
    const durationMinutes = (endTime - session.startTime) / (1000 * 60);
    
    // Update session with end time
    session.endTime = endTime;
    await session.save();

    // Get user and add connection time to tracking fields
    const user = await User.findById(req.user.userId);
    const totalTimeBeforeSession = user.totalTimeConnected;
    
    // Add session duration to user's time tracking fields
    await user.addConnectionTime(durationMinutes);
    
    // Calculate how many complete hours of total time the user now has
    const totalHoursAfterSession = Math.floor(user.totalTimeConnected / 60);
    const totalHoursBeforeSession = Math.floor(totalTimeBeforeSession / 60);
    
    // Award points for any new complete hours achieved
    const newHoursToAward = totalHoursAfterSession - totalHoursBeforeSession;
    let pointsAwarded = 0;
    
    if (newHoursToAward > 0) {
      pointsAwarded = newHoursToAward * POINTS_PER_HOUR;
      
      // Update user points
      await User.findByIdAndUpdate(
        req.user.userId,
        { $inc: { points: pointsAwarded } }
      );

      // Create point record for the new hours
      const pointRecord = new Point({
        userId: req.user.userId,
        amount: pointsAwarded,
        type: 'ATTENDANCE',
        description: `${newHoursToAward} hour(s) of total WiFi attendance milestone reached`,
        metadata: {
          sessionId: session._id,
          startTime: session.startTime,
          endTime: endTime,
          hoursAwarded: newHoursToAward,
          totalHoursAchieved: totalHoursAfterSession,
          sessionDurationMinutes: Math.floor(durationMinutes),
          isTimeTrackingAward: true
        }
      });
      await pointRecord.save();

      // Update trees with WiFi hours - only trees planted before session start
      const userTrees = await Tree.find({ 
        userId: req.user.userId,
        plantedDate: { $lte: session.startTime }
      });
      if (userTrees.length > 0) {
        const treeUpdatePromises = userTrees.map(async (tree) => {
          tree.addWifiHours(newHoursToAward);
          return tree.save();
        });
        
        await Promise.all(treeUpdatePromises);
        logger.info('WiFi hours added to trees:', { 
          userId: req.user.userId, 
          hours: newHoursToAward, 
          treesUpdated: userTrees.length,
          sessionStartTime: session.startTime
        });
      }

      // Update session with points awarded
      session.pointsAwarded = pointsAwarded;
      await session.save();

      logger.info('Points awarded for session completion:', {
        userId: req.user.userId,
        sessionId: session._id,
        sessionDurationMinutes: Math.floor(durationMinutes),
        totalTimeBeforeSession: Math.floor(totalTimeBeforeSession),
        totalTimeAfterSession: Math.floor(user.totalTimeConnected),
        totalHoursBeforeSession,
        totalHoursAfterSession,
        newHoursToAward,
        pointsAwarded
      });
    } else {
      logger.info('Session ended with no new hours completed:', {
        userId: req.user.userId,
        sessionId: session._id,
        sessionDurationMinutes: Math.floor(durationMinutes),
        totalTimeAfterSession: Math.floor(user.totalTimeConnected),
        totalHoursAfterSession
      });
    }

    // Get updated user data
    const updatedUser = await User.findById(req.user.userId);

    res.json({
      session,
      pointsAwarded,
      newHoursAwarded: newHoursToAward,
      sessionDurationMinutes: Math.floor(durationMinutes),
      totalTimeConnected: Math.floor(updatedUser.totalTimeConnected),
      totalHoursCompleted: totalHoursAfterSession,
      timeTracking: {
        day: Math.floor(updatedUser.dayTimeConnected),
        week: Math.floor(updatedUser.weekTimeConnected),
        month: Math.floor(updatedUser.monthTimeConnected),
        total: Math.floor(updatedUser.totalTimeConnected)
      }
    });
  } catch (error) {
    logger.error('End WiFi session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active session with current progress
router.get('/active', auth, async (req, res) => {
  try {
    console.log('WiFi active endpoint called:', {
      userId: req.user?.userId,
      userEmail: req.user?.email,
      hasUser: !!req.user,
      timestamp: new Date().toISOString()
    });

    const session = await WifiSession.findOne({
      user: req.user.userId,
      endTime: null,
    });

    if (!session) {
      console.log('No active session found for user:', req.user.userId);
      return res.json(null);
    }

    const user = await User.findById(req.user.userId);
    const currentTime = new Date();
    const durationMinutes = (currentTime - session.startTime) / (1000 * 60);
    
    // Calculate what the total time would be after this session
    const potentialTotalTime = user.totalTimeConnected + durationMinutes;
    const currentTotalHours = Math.floor(user.totalTimeConnected / 60);
    const potentialTotalHours = Math.floor(potentialTotalTime / 60);
    
    // Points that could be earned from completing this session
    const potentialNewHours = potentialTotalHours - currentTotalHours;
    const potentialPoints = potentialNewHours * POINTS_PER_HOUR;
    
    // Progress to next total hour reward
    const minutesToNextReward = 60 - (potentialTotalTime % 60);
    const progressToNextReward = ((potentialTotalTime % 60) / 60) * 100;

    const sessionWithProgress = {
      ...session.toObject(),
      currentDurationMinutes: Math.floor(durationMinutes),
      currentTotalTimeMinutes: Math.floor(user.totalTimeConnected),
      currentTotalHours,
      potentialTotalTimeMinutes: Math.floor(potentialTotalTime),
      potentialTotalHours,
      potentialNewHours,
      potentialPoints,
      minutesToNextReward: Math.ceil(minutesToNextReward),
      progressToNextReward: Math.floor(progressToNextReward),
      timeTracking: {
        day: Math.floor(user.dayTimeConnected),
        week: Math.floor(user.weekTimeConnected),
        month: Math.floor(user.monthTimeConnected),
        total: Math.floor(user.totalTimeConnected)
      }
    };

    console.log('Returning active session data for user:', req.user.userId);
    res.json(sessionWithProgress);
  } catch (error) {
    logger.error('Get active session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get session history
router.get('/history', auth, async (req, res) => {
  try {
    const sessions = await WifiSession.find({
      user: req.user.userId,
      endTime: { $ne: null },
    }).sort({ startTime: -1 });

    res.json(sessions);
  } catch (error) {
    logger.error('Get session history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user time tracking stats
router.get('/time-tracking', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check and reset time periods if needed
    await user.checkAndResetTimePeriods();

    const totalHours = Math.floor(user.totalTimeConnected / 60);
    const dayHours = Math.floor(user.dayTimeConnected / 60);
    const weekHours = Math.floor(user.weekTimeConnected / 60);
    const monthHours = Math.floor(user.monthTimeConnected / 60);

    const stats = {
      timeTracking: {
        day: {
          minutes: Math.floor(user.dayTimeConnected),
          hours: dayHours,
          progress: (user.dayTimeConnected % 60) / 60 * 100 // Progress to next hour
        },
        week: {
          minutes: Math.floor(user.weekTimeConnected),
          hours: weekHours,
          progress: (user.weekTimeConnected % 60) / 60 * 100
        },
        month: {
          minutes: Math.floor(user.monthTimeConnected),
          hours: monthHours,
          progress: (user.monthTimeConnected % 60) / 60 * 100
        },
        total: {
          minutes: Math.floor(user.totalTimeConnected),
          hours: totalHours,
          progress: (user.totalTimeConnected % 60) / 60 * 100
        }
      },
      pointsFromTotalTime: totalHours * POINTS_PER_HOUR,
      nextHourReward: POINTS_PER_HOUR,
      minutesToNextReward: 60 - (user.totalTimeConnected % 60)
    };

    res.json(stats);
  } catch (error) {
    logger.error('Get time tracking stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 