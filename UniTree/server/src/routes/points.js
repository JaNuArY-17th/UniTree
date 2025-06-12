const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Point = require('../models/Point');

// Get user's points and transaction history
router.get('/', auth, async (req, res) => {
  try {
    const points = await Point.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const totalPoints = await User.findById(req.user._id).select('points');

    res.json({
      points: totalPoints.points,
      transactions: points
    });
  } catch (error) {
    console.error('Error fetching points:', error);
    res.status(500).json({ message: 'Error fetching points' });
  }
});

module.exports = router;