const mongoose = require('mongoose');

const treeTypeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  scientificName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  careLevel: {
    type: String,
    enum: ['Easy', 'Moderate', 'Hard'],
    default: 'Moderate'
  },
  maxHeight: {
    type: String,
    required: true
  },
  lifespan: {
    type: String,
    required: true
  },
  nativeTo: {
    type: String,
    required: true
  },
  cost: {
    type: Number,
    default: 100
  },
  stages: [{
    name: {
      type: String,
      required: true
    },
    hoursRequired: {
      type: Number,
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    tips: [{
      type: String
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
treeTypeSchema.index({ id: 1 });
treeTypeSchema.index({ isActive: 1 });

const TreeType = mongoose.model('TreeType', treeTypeSchema);

module.exports = TreeType; 