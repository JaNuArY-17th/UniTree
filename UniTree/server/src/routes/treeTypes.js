const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const TreeType = require('../models/TreeType');
const logger = require('../utils/logger');

// Get all available tree types
router.get('/', async (req, res) => {
  try {
    const treeTypes = await TreeType.find({ isActive: true }).sort({ createdAt: 1 });
    res.json(treeTypes);
  } catch (error) {
    logger.error('Get tree types error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific tree type by ID
router.get('/:id', async (req, res) => {
  try {
    const treeType = await TreeType.findOne({ id: req.params.id, isActive: true });
    if (!treeType) {
      return res.status(404).json({ message: 'Tree type not found' });
    }
    res.json(treeType);
  } catch (error) {
    logger.error('Get tree type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new tree type (admin only)
router.post('/', auth, async (req, res) => {
  try {
    // Add admin check here if needed
    const treeType = new TreeType(req.body);
    await treeType.save();
    
    logger.info('Tree type created:', { treeTypeId: treeType.id });
    res.status(201).json(treeType);
  } catch (error) {
    logger.error('Create tree type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a tree type (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Add admin check here if needed
    const treeType = await TreeType.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    
    if (!treeType) {
      return res.status(404).json({ message: 'Tree type not found' });
    }
    
    logger.info('Tree type updated:', { treeTypeId: treeType.id });
    res.json(treeType);
  } catch (error) {
    logger.error('Update tree type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a tree type (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Add admin check here if needed
    const treeType = await TreeType.findOneAndUpdate(
      { id: req.params.id },
      { $set: { isActive: false } },
      { new: true }
    );
    
    if (!treeType) {
      return res.status(404).json({ message: 'Tree type not found' });
    }
    
    logger.info('Tree type deactivated:', { treeTypeId: treeType.id });
    res.json({ message: 'Tree type deactivated successfully' });
  } catch (error) {
    logger.error('Delete tree type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 