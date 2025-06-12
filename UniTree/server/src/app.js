require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const wifiRoutes = require('./routes/wifi');
const treeRoutes = require('./routes/tree');
const treeTypeRoutes = require('./routes/treeTypes');
const pointsRoutes = require('./routes/points');
const notificationRoutes = require('./routes/notification');
const leaderboardRoutes = require('./routes/leaderboard');

const app = express();

// Environment-based configuration
const MAX_REQUEST_SIZE = process.env.MAX_REQUEST_SIZE || '10mb';
const CLIENT_URLS = [
  process.env.CLIENT_URL,
  process.env.CLIENT_DEV_URL,
  'http://localhost:19000',
  'http://localhost:8081',
  // Add support for mobile app on local network
  process.env.CLIENT_URL_DEV,
  process.env.CLIENT_URL_DEV_2
].filter(Boolean);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? true : CLIENT_URLS, // Allow all origins in development
  credentials: true
}));
app.use(express.json({ limit: MAX_REQUEST_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_REQUEST_SIZE }));

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected successfully');
    console.log('Database URI:', process.env.MONGODB_URI);
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wifi', wifiRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/tree-types', treeTypeRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'WIFI_SSID'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Configured CORS origins:', CLIENT_URLS);
  console.log('University WiFi SSID:', process.env.WIFI_SSID);
  console.log('Points per hour:', process.env.POINTS_PER_HOUR);
});

module.exports = app; 