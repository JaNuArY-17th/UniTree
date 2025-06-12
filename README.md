# UniTree

UniTree is a mobile application that incentivizes university students to attend classes by rewarding them with points for time spent connected to designated school WiFi networks. These points can be redeemed for real-world tree saplings planted on their behalf.

## Features

- School WiFi-based attendance tracking
- Point accumulation system
- Tree sapling redemption
- Virtual tree profile and growth tracking
- Admin dashboard for management

## Project Structure

```
UniTree/
├── mobile/          # React Native mobile app
├── web/            # Next.js admin dashboard
└── server/         # Node.js backend API
```

## Backend Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration:

### Required Environment Variables

#### Server Configuration
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

#### Database Configuration
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_TEST_URI` - Test database URI (optional)

#### Authentication Configuration
- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_EXPIRE` - Token expiration time (default: 7d)

#### WiFi Tracking Configuration
- `WIFI_SSID` - University WiFi network name
- `WIFI_CHECK_INTERVAL` - Check interval in milliseconds
- `MIN_SESSION_DURATION` - Minimum session duration in minutes

#### Points Configuration
- `POINTS_PER_HOUR` - Points awarded per hour of attendance
- `TREE_COST` - Points required to redeem a tree
- `ACHIEVEMENT_POINTS_THRESHOLD` - Points threshold for achievements

#### API Configuration
- `API_TIMEOUT` - API request timeout in milliseconds
- `MAX_REQUEST_SIZE` - Maximum request size (e.g., "10mb")

#### Client Configuration
- `CLIENT_URL` - Frontend client URL
- `CLIENT_DEV_URL` - Development client URL

4. Start the development server:
```bash
npm run dev
```

## API Documentation

### Authentication

#### User Registration
```
POST /api/auth/register
Body: {
  "email": "student@university.edu",
  "password": "password123",
  "studentId": "12345" (optional)
}
```

#### User Login
```
POST /api/auth/login
Body: {
  "email": "student@university.edu",
  "password": "password123"
}
```

#### Admin Login
```
POST /api/auth/admin/login
Body: {
  "email": "admin@unitree.com",
  "password": "adminpass"
}
```

### WiFi Sessions

#### Start Session
```
POST /api/wifi-sessions/start
Headers: {
  "Authorization": "Bearer {token}"
}
Body: {
  "ssid": "University_WiFi"
}
```

#### End Session
```
POST /api/wifi-sessions/end
Headers: {
  "Authorization": "Bearer {token}"
}
```

### Points

#### Get User Points
```
GET /api/points
Headers: {
  "Authorization": "Bearer {token}"
}
```

### Redemptions

#### Create Redemption Request
```
POST /api/redemptions
Headers: {
  "Authorization": "Bearer {token}"
}
```

### Trees

#### Get User Trees
```
GET /api/trees
Headers: {
  "Authorization": "Bearer {token}"
}
```

## Mobile App Setup

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration:

### Required Environment Variables

#### API Configuration
- `API_URL` - Backend API URL (production)
- `API_DEV_URL` - Backend API URL (development)
- `API_TIMEOUT` - API request timeout in milliseconds

#### WiFi Configuration
- `WIFI_SSID` - University WiFi network name
- `WIFI_CHECK_INTERVAL` - Check interval in milliseconds

#### Points Configuration
- `POINTS_PER_HOUR` - Points per hour of attendance
- `POINTS_PER_TREE` - Points required for tree redemption

#### Development Configuration
- `DEV_MODE` - Development mode flag

4. Start the development server:
```bash
npx expo start
```

## Admin Dashboard Setup (Coming Soon)

Instructions for setting up and running the Next.js admin dashboard.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the ISC License. 