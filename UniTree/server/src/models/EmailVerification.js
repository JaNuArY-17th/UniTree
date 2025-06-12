const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  verificationCode: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['registration', 'password_reset'],
    default: 'registration'
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Maximum 5 attempts
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    index: { expireAfterSeconds: 0 } // MongoDB TTL index to auto-delete expired documents
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for email lookup
emailVerificationSchema.index({ email: 1 });

// Clean up expired/completed verifications
emailVerificationSchema.index({ 
  expiresAt: 1 
}, { 
  expireAfterSeconds: 0 
});

// Static method to find active verification
emailVerificationSchema.statics.findActiveVerification = function(email, type = 'registration') {
  return this.findOne({
    email: email.toLowerCase().trim(),
    type: type,
    isVerified: false,
    expiresAt: { $gt: new Date() }
  });
};

// Instance method to check if verification is expired
emailVerificationSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Instance method to check if max attempts reached
emailVerificationSchema.methods.hasMaxAttemptsReached = function() {
  return this.attempts >= 5;
};

const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);

module.exports = EmailVerification; 