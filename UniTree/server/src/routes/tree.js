const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Tree = require('../models/Tree');
const TreeType = require('../models/TreeType');
const User = require('../models/User');
const Point = require('../models/Point');
const logger = require('../utils/logger');

// Get all available tree types
router.get('/types', async (req, res) => {
  try {
    const treeTypes = await TreeType.find({ isActive: true }).sort({ createdAt: 1 });
    res.json(treeTypes);
  } catch (error) {
    logger.error('Get tree types error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Purchase a tree
router.post('/purchase', auth, async (req, res) => {
  try {
    const { species } = req.body;
    const user = req.user;

    if (user.points < process.env.TREE_COST) {
      return res.status(400).json({ message: 'Insufficient points' });
    }

    // Create new tree
    const tree = new Tree({
      userId: user._id,
      species,
      stage: 'sapling',
      health: 100,
      plantedDate: new Date(),
    });

    await tree.save();

    // Deduct points from user
    user.points -= process.env.TREE_COST;
    user.trees.push(tree._id);
    await user.save();

    res.json(tree);
  } catch (error) {
    logger.error('Purchase tree error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all trees for the current user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Get trees request - User ID:', req.user._id);
    const trees = await Tree.find({ userId: req.user._id });
    console.log('Found trees:', trees.length);
    
    // Update each tree's stage based on accumulated WiFi hours
    const updatedTrees = [];
    for (const tree of trees) {
      // Update stage based on current WiFi hours
      tree.updateStageFromWifiHours();
      // Update health score
      tree.updateHealthScore();
      // Save if there were changes
      await tree.save();
      updatedTrees.push(tree);
    }
    
    console.log('Trees after stage update:', updatedTrees.map(t => ({ 
      id: t._id, 
      species: t.species, 
      stage: t.currentStage, 
      wifiHours: t.wifiHoursAccumulated 
    })));
    
    res.json(updatedTrees);
  } catch (error) {
    console.error('Error fetching trees:', error);
    res.status(500).json({ message: 'Error fetching trees' });
  }
});

// Get a specific tree
router.get('/:id', auth, async (req, res) => {
  try {
    const tree = await Tree.findOne({ _id: req.params.id, userId: req.user._id });
    if (!tree) {
      return res.status(404).json({ message: 'Tree not found' });
    }
    
    // Update stage based on current WiFi hours
    tree.updateStageFromWifiHours();
    // Update health score
    tree.updateHealthScore();
    // Save if there were changes
    await tree.save();
    
    res.json(tree);
  } catch (error) {
    console.error('Error fetching tree:', error);
    res.status(500).json({ message: 'Error fetching tree' });
  }
});

// Create a new tree
router.post('/', auth, async (req, res) => {
  try {
    const tree = new Tree({
      ...req.body,
      userId: req.user._id,
      plantedDate: new Date(),
      lastWatered: new Date(),
      healthScore: 100,
    });
    await tree.save();
    res.status(201).json(tree);
  } catch (error) {
    console.error('Error creating tree:', error);
    res.status(500).json({ message: 'Error creating tree' });
  }
});

// Update a tree
router.put('/:id', auth, async (req, res) => {
  try {
    const tree = await Tree.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!tree) {
      return res.status(404).json({ message: 'Tree not found' });
    }
    res.json(tree);
  } catch (error) {
    console.error('Error updating tree:', error);
    res.status(500).json({ message: 'Error updating tree' });
  }
});

// Add WiFi hours to trees
router.post('/add-wifi-hours', auth, async (req, res) => {
  try {
    const { hours } = req.body;
    
    if (!hours || hours <= 0) {
      return res.status(400).json({ message: 'Valid hours amount is required' });
    }

    // Get all user's trees
    const trees = await Tree.find({ userId: req.user._id });
    
    if (trees.length === 0) {
      return res.status(404).json({ message: 'No trees found' });
    }

    const updatedTrees = [];
    
    // Add WiFi hours to all trees
    for (const tree of trees) {
      const result = tree.addWifiHours(hours);
      await tree.save();
      
      updatedTrees.push({
        treeId: tree._id,
        name: tree.name,
        species: tree.species,
        ...result
      });
    }

    logger.info('WiFi hours added to trees:', { 
      userId: req.user.id, 
      hours, 
      treesUpdated: updatedTrees.length 
    });

    res.json({
      message: `Added ${hours} WiFi hours to ${updatedTrees.length} tree(s)`,
      trees: updatedTrees
    });
  } catch (error) {
    logger.error('Add WiFi hours error:', error);
    res.status(500).json({ message: 'Error adding WiFi hours' });
  }
});

// Delete a tree
router.delete('/:id', auth, async (req, res) => {
  try {
    const tree = await Tree.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!tree) {
      return res.status(404).json({ message: 'Tree not found' });
    }
    res.json({ message: 'Tree deleted successfully' });
  } catch (error) {
    console.error('Error deleting tree:', error);
    res.status(500).json({ message: 'Error deleting tree' });
  }
});

// Redeem a tree
router.post('/redeem', auth, async (req, res) => {
  try {
    const { speciesId } = req.body;
    
    console.log('Debug - Request body:', req.body);
    console.log('Debug - User:', req.user);
    
    // Validate species ID
    if (!speciesId) {
      return res.status(400).json({ message: 'Species ID is required' });
    }

    // Get tree type information
    const treeType = await TreeType.findOne({ id: speciesId, isActive: true });
    if (!treeType) {
      return res.status(400).json({ message: 'Invalid tree species' });
    }

    // Get user from auth middleware
    const user = req.user;
    console.log('Debug - User points:', user.points);

    // Check if user has enough points using tree type cost
    const TREE_COST = treeType.cost || 100;
    if (user.points < TREE_COST) {
      return res.status(400).json({ 
        message: `Insufficient points. You need ${TREE_COST} points but have ${user.points}.` 
      });
    }

    // Create new tree
    const tree = new Tree({
      userId: user._id,
      treeTypeId: speciesId,
      species: treeType.name,
      name: `${treeType.name}`,
      plantedDate: new Date(),
      lastWatered: new Date(),
      healthScore: 100,
      currentStage: 0,
      wifiHoursAccumulated: 0,
      totalHoursRequired: 6,
      location: {
        latitude: 0,
        longitude: 0
      }
    });

    console.log('Debug - Creating tree:', tree);

    // Save the tree first
    try {
      await tree.save();
      console.log('Debug - Tree saved successfully:', {
        treeId: tree._id,
        userId: tree.userId,
        species: tree.species
      });
    } catch (saveError) {
      console.error('Debug - Tree save error details:', {
        error: saveError,
        stack: saveError.stack,
        validationErrors: saveError.errors
      });
      logger.error('Tree save error:', saveError);
      return res.status(400).json({ 
        message: 'Failed to save tree',
        error: saveError.message,
        validationErrors: saveError.errors
      });
    }

    // Create point transaction
    const pointTransaction = new Point({
      userId: user._id,
      amount: -TREE_COST,
      type: 'TREE_REDEMPTION',
      metadata: {
        treeId: tree._id,
        species: speciesId
      }
    });

    console.log('Debug - Creating point transaction:', pointTransaction);

    // Save the transaction
    try {
      await pointTransaction.save();
      console.log('Debug - Point transaction saved successfully:', {
        transactionId: pointTransaction._id,
        amount: pointTransaction.amount,
        userId: pointTransaction.userId
      });
    } catch (transactionError) {
      console.error('Debug - Transaction error details:', {
        error: transactionError,
        stack: transactionError.stack,
        validationErrors: transactionError.errors
      });
      // If transaction fails, delete the tree we just created
      await Tree.findByIdAndDelete(tree._id);
      logger.error('Point transaction error:', transactionError);
      return res.status(400).json({ 
        message: 'Failed to create point transaction',
        error: transactionError.message,
        validationErrors: transactionError.errors
      });
    }

    // Update user in database
    try {
      console.log('Debug - Before user update:', {
        userId: user._id,
        currentPoints: user.points,
        currentTreesPlanted: user.treesPlanted,
        treeId: tree._id
      });

      // Update user in the database directly using atomic operations
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $inc: { 
            points: -TREE_COST,
            treesPlanted: 1
          },
          $push: { 
            trees: tree._id 
          }
        },
        { 
          new: true, 
          runValidators: true 
        }
      );

      if (!updatedUser) {
        throw new Error('User not found during update');
      }

      console.log('Debug - After user update:', {
        userId: updatedUser._id,
        newPoints: updatedUser.points,
        newTreesPlanted: updatedUser.treesPlanted,
        treesArray: updatedUser.trees
      });

      // Verify the changes were saved
      const verifyUser = await User.findById(user._id);
      console.log('Debug - Verification of user update:', {
        userId: verifyUser._id,
        points: verifyUser.points,
        treesPlanted: verifyUser.treesPlanted,
        treesArray: verifyUser.trees
      });

      // Update the local user object to match the database
      user.points = updatedUser.points;
      user.treesPlanted = updatedUser.treesPlanted;
      user.trees = updatedUser.trees;

      // Send success response with complete information
      res.json({
        success: true,
        message: 'Tree redeemed successfully',
        tree: {
          _id: tree._id,
          species: tree.species,
          name: tree.name,
          stage: tree.stage,
          healthScore: tree.healthScore,
          plantedDate: tree.plantedDate
        },
        transaction: {
          _id: pointTransaction._id,
          amount: pointTransaction.amount,
          type: pointTransaction.type
        },
        remainingPoints: updatedUser.points,
        user: {
          points: updatedUser.points,
          treesPlanted: updatedUser.treesPlanted
        }
      });

    } catch (userError) {
      console.error('Debug - User update error details:', {
        error: userError,
        stack: userError.stack,
        validationErrors: userError.errors,
        userId: user._id,
        attemptedPoints: user.points - TREE_COST
      });

      // If user update fails, delete the tree and transaction
      await Tree.findByIdAndDelete(tree._id);
      await Point.findByIdAndDelete(pointTransaction._id);
      
      logger.error('User update error:', userError);
      return res.status(400).json({ 
        message: 'Failed to update user points',
        error: userError.message,
        validationErrors: userError.errors
      });
    }

  } catch (error) {
    console.error('Debug - Full error details:', {
      error: error,
      stack: error.stack,
      message: error.message,
      code: error.code,
      name: error.name
    });
    logger.error('Tree redemption error:', error);
    res.status(500).json({ 
      message: error.message || 'Error redeeming tree',
      error: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        code: error.code,
        name: error.name
      } : undefined
    });
  }
});

module.exports = router; 