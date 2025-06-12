const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    maxlength: 16,
    validate: {
      validator: function(password) {
        // Password must contain: uppercase, lowercase, number, and symbol
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        return hasUppercase && hasLowercase && hasNumber && hasSymbol;
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol'
    },
    select: false
  },
  nickname: {
    type: String,
    required: [true, 'Please provide a nickname']
  },
  fullname: {
    type: String,
    required: [true, 'Please provide a full name']
  },
  points: {
    type: Number,
    default: 0
  },
  treesPlanted: {
    type: Number,
    default: 0
  },
  university: {
    type: String,
    enum: ['Hanoi', 'Danang', 'Cantho', 'TP.HCM'],
    required: true
  },
  studentId: {
    type: String,
    required: [true, 'Please provide a student ID'],
    unique: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  trees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tree'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  notificationSettings: {
    treeHealth: { type: Boolean, default: true },
    achievements: { type: Boolean, default: true },
    attendance: { type: Boolean, default: true },
  },
  lastAttendance: {
    type: Date,
    default: null,
  },
  attendanceStreak: {
    type: Number,
    default: 0,
  },
  avatar: {
    type: String,
    default: null
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness for non-null values
  },
  // WiFi time tracking fields
  totalTimeConnected: {
    type: Number,
    default: 0  // Total time in minutes
  },
  monthTimeConnected: {
    type: Number,
    default: 0  // Time in minutes for current month
  },
  weekTimeConnected: {
    type: Number,
    default: 0  // Time in minutes for current week
  },
  dayTimeConnected: {
    type: Number,
    default: 0  // Time in minutes for current day
  },
  // Reset tracking fields
  lastDayReset: {
    type: Date,
    default: Date.now
  },
  lastWeekReset: {
    type: Date,
    default: Date.now
  },
  lastMonthReset: {
    type: Date,
    default: Date.now
  },
}, {
  timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Update points method
userSchema.methods.updatePoints = async function(points) {
  this.points += points;
  await this.save();
  return this.points;
};

// Method to add time to all time tracking fields
userSchema.methods.addConnectionTime = async function(minutes) {
  // Check if we need to reset any time periods
  await this.checkAndResetTimePeriods();
  
  // Add time to all tracking fields
  this.totalTimeConnected += minutes;
  this.monthTimeConnected += minutes;
  this.weekTimeConnected += minutes;
  this.dayTimeConnected += minutes;
  
  await this.save();
  return this;
};

// Method to check and reset time periods if needed
userSchema.methods.checkAndResetTimePeriods = async function() {
  const now = new Date();
  let needsSave = false;
  
  // Check if we need to reset day time (at midnight)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (this.lastDayReset < todayStart) {
    this.dayTimeConnected = 0;
    this.lastDayReset = now;
    needsSave = true;
  }
  
  // Check if we need to reset week time (at start of week - Monday)
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = now.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
  weekStart.setDate(weekStart.getDate() - daysToSubtract);
  
  if (this.lastWeekReset < weekStart) {
    this.weekTimeConnected = 0;
    this.lastWeekReset = now;
    needsSave = true;
  }
  
  // Check if we need to reset month time (at start of month)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  if (this.lastMonthReset < monthStart) {
    this.monthTimeConnected = 0;
    this.lastMonthReset = now;
    needsSave = true;
  }
  
  if (needsSave) {
    await this.save();
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User; 