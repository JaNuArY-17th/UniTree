const mongoose = require('mongoose');

const treeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  treeTypeId: {
    type: String,
    required: true,
    ref: 'TreeType'
  },
  species: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  plantedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  lastWatered: {
    type: Date,
    required: true,
    default: Date.now
  },
  currentStage: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  wifiHoursAccumulated: {
    type: Number,
    default: 0
  },
  totalHoursRequired: {
    type: Number,
    default: 6 // 6 hours total (1 hour per stage from 0 to 5)
  },
  healthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  location: {
    latitude: {
      type: Number,
      default: 0
    },
    longitude: {
      type: Number,
      default: 0
    }
  },
  imageUrl: String,
  milestones: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['PLANTED', 'STAGE_CHANGE', 'PERFECT_HEALTH', 'WIFI_GROWTH']
    },
    description: String,
    metadata: {
      stage: Number,
      hoursAccumulated: Number
    }
  }]
}, {
  timestamps: true
});

// Add milestone when tree is created
treeSchema.pre('save', function(next) {
  if (this.isNew) {
    this.milestones.push({
      type: 'PLANTED',
      description: 'Tree was planted'
    });
  }
  next();
});

// Calculate health score based on watering frequency
treeSchema.methods.updateHealthScore = function() {
  const now = new Date();
  const daysSinceWatered = (now - this.lastWatered) / (1000 * 60 * 60 * 24);
  
  // Reduce health by 10 points for each day without watering
  const healthReduction = Math.floor(daysSinceWatered) * 10;
  this.healthScore = Math.max(0, 100 - healthReduction);
  
  return this.healthScore;
};

// Update stage based on WiFi hours accumulated
treeSchema.methods.updateStageFromWifiHours = function() {
  // Each stage requires 1 hour of WiFi time
  const newStage = Math.min(5, Math.floor(this.wifiHoursAccumulated));
  
  // Add milestone if stage changed
  if (newStage > this.currentStage) {
    this.milestones.push({
      type: 'STAGE_CHANGE',
      description: `Grew to stage ${newStage} with ${this.wifiHoursAccumulated} hours of university WiFi`,
      metadata: {
        stage: newStage,
        hoursAccumulated: this.wifiHoursAccumulated
      }
    });
    this.currentStage = newStage;
  }
  
  return this.currentStage;
};

// Add WiFi hours to the tree
treeSchema.methods.addWifiHours = function(hours) {
  const previousHours = this.wifiHoursAccumulated;
  this.wifiHoursAccumulated += hours;
  
  // Check if tree can grow to next stage
  const stageChanged = this.updateStageFromWifiHours();
  
  // Add WiFi growth milestone
  this.milestones.push({
    type: 'WIFI_GROWTH',
    description: `Added ${hours} hours of university WiFi time (Total: ${this.wifiHoursAccumulated} hours)`,
    metadata: {
      stage: this.currentStage,
      hoursAccumulated: this.wifiHoursAccumulated
    }
  });
  
  return {
    hoursAdded: hours,
    totalHours: this.wifiHoursAccumulated,
    stageChanged,
    currentStage: this.currentStage
  };
};

// Pre-save middleware to update health
treeSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updateHealthScore();
  }
  next();
});

const Tree = mongoose.model('Tree', treeSchema);

module.exports = Tree; 