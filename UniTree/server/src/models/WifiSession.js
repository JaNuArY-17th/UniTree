const mongoose = require('mongoose');

const wifiSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ssid: {
    type: String,
    required: true
  },
  bssid: {
    type: String,
    required: false // Optional for backward compatibility
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  pointsAwarded: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
wifiSessionSchema.index({ user: 1, startTime: -1 });
wifiSessionSchema.index({ user: 1, endTime: 1 });

module.exports = mongoose.model('WifiSession', wifiSessionSchema); 