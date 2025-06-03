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
- MongoDB connection string
- JWT secret
- Allowed email domains
- WiFi SSIDs
- Points configuration

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

## Mobile App Setup (Coming Soon)

Instructions for setting up and running the React Native mobile application.

## Admin Dashboard Setup (Coming Soon)

Instructions for setting up and running the Next.js admin dashboard.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the ISC License. 