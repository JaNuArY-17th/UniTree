# UniTree Deployment Guide

This guide covers deploying all components of the UniTree application: Backend Server, Mobile App, and Web Dashboard.

## Prerequisites

- Node.js 18+ installed
- MongoDB database (MongoDB Atlas recommended)
- Git repository access
- Domain name (optional but recommended)

## 1. Backend Server Deployment

### Option A: Render (Recommended - Free Tier)

1. **Sign up for Render**: Go to [render.com](https://render.com)
2. **Connect your repository**: Link your GitHub repository
3. **Create Web Service**: 
   - Root Directory: `UniTree/server`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Environment Variables**: Set these in Render dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secure_jwt_secret
   JWT_EXPIRE=7d
   WIFI_SSID=University_WiFi
   WIFI_CHECK_INTERVAL=60000
   MIN_SESSION_DURATION=5
   POINTS_PER_HOUR=10
   TREE_COST=100
   API_TIMEOUT=30000
   MAX_REQUEST_SIZE=10mb
   CLIENT_URL=https://your-web-dashboard-url.com
   ```
5. **Deploy**: Render will automatically deploy on every push

### Option B: Railway (Database Only)
*Note: Railway's trial plan only supports database hosting*

1. **Sign up for Railway**: Go to [railway.app](https://railway.app)
2. **Deploy MongoDB**: Use Railway for your database instead of MongoDB Atlas
3. **Get connection string**: Use Railway's MongoDB URL in other deployment options

### Option C: Vercel (Serverless Functions)

1. **Sign up for Vercel**: Go to [vercel.com](https://vercel.com)
2. **Install Vercel CLI**: `npm i -g vercel`
3. **Create `vercel.json`** in `UniTree/server`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/app.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "src/app.js"
       }
     ]
   }
   ```
4. **Deploy**: `vercel --prod`

### Option D: Heroku (Free alternatives)

**Since Heroku discontinued free tier, try these instead:**
- **Adaptable.io** - Free Node.js hosting
- **Cyclic.sh** - Free serverless Node.js
- **Glitch.com** - Free with limitations

### Option E: Docker (Any cloud provider)

1. **Build image**:
   ```bash
   cd UniTree/server
   docker build -t unitree-server .
   ```
2. **Run locally** (test):
   ```bash
   docker run -p 3000:3000 --env-file .env unitree-server
   ```
3. **Deploy to cloud**: Push to Docker Hub, then deploy to your preferred cloud provider

## 2. Mobile App Deployment

### Expo Application Services (EAS)

1. **Install EAS CLI**:
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure project**:
   ```bash
   cd UniTree/mobile
   eas build:configure
   ```

4. **Update environment variables**: Create `UniTree/mobile/.env`:
   ```
   API_URL=https://your-deployed-backend-url.com
   API_DEV_URL=http://localhost:3000
   API_TIMEOUT=30000
   WIFI_SSID=University_WiFi
   WIFI_CHECK_INTERVAL=60000
   POINTS_PER_HOUR=10
   POINTS_PER_TREE=100
   DEV_MODE=false
   ```

5. **Build for testing** (APK):
   ```bash
   eas build --platform android --profile preview
   ```

6. **Build for production**:
   ```bash
   eas build --platform android --profile production
   eas build --platform ios --profile production
   ```

7. **Submit to stores**:
   ```bash
   eas submit --platform android
   eas submit --platform ios
   ```

### Alternative: Build APK locally

1. **Install Android Studio** and set up Android SDK
2. **Build**:
   ```bash
   cd UniTree/mobile
   expo run:android --variant release
   ```

## 3. Web Dashboard Deployment

### Vercel (Recommended for Next.js)

1. **Sign up for Vercel**: Go to [vercel.com](https://vercel.com)
2. **Connect repository**: Import your GitHub repository
3. **Set root directory**: `UniTree/web`
4. **Environment variables**: Set in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://your-deployed-backend-url.com
   NEXTAUTH_SECRET=your_secret_key
   NEXTAUTH_URL=https://your-vercel-app.vercel.app
   ```
5. **Deploy**: Vercel will auto-deploy on push

### Netlify Alternative

1. **Sign up for Netlify**: Go to [netlify.com](https://netlify.com)
2. **Connect repository**
3. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `out` or `dist`
   - Base directory: `UniTree/web`

## 4. Database Setup

### MongoDB Atlas (Recommended)

1. **Create account**: Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Create cluster**: Choose free tier
3. **Create database user**: With read/write permissions
4. **Whitelist IP**: Add `0.0.0.0/0` for all IPs (or specific IPs)
5. **Get connection string**: Use in `MONGODB_URI` environment variable

## 5. Domain Setup (Optional)

1. **Purchase domain**: From any registrar
2. **Configure DNS**:
   - Backend: `api.yourdomain.com` → Railway/Heroku URL
   - Web: `app.yourdomain.com` → Vercel URL
3. **Update environment variables**: Use your custom domains

## 6. Testing Deployment

1. **Backend health check**: Visit `https://your-backend-url.com/health`
2. **Mobile app**: Download from build URL or stores
3. **Web dashboard**: Visit your web URL

## 7. Monitoring & Maintenance

### Logging
- Backend logs available in Railway/Heroku dashboard
- Set up log aggregation (e.g., LogRocket, Sentry)

### Monitoring
- Use Uptime Robot for uptime monitoring
- Set up error tracking with Sentry

### Updates
- Mobile: Build new versions with EAS
- Backend: Push to git (auto-deploys)
- Web: Push to git (auto-deploys)

## Environment Variables Summary

### Backend (.env)
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_super_secure_secret
JWT_EXPIRE=7d
WIFI_SSID=University_WiFi
WIFI_CHECK_INTERVAL=60000
MIN_SESSION_DURATION=5
POINTS_PER_HOUR=10
TREE_COST=100
ACHIEVEMENT_POINTS_THRESHOLD=500
API_TIMEOUT=30000
MAX_REQUEST_SIZE=10mb
CLIENT_URL=https://your-web-url.com
CLIENT_DEV_URL=http://localhost:3001
```

### Mobile (.env)
```
API_URL=https://your-backend-url.com
API_DEV_URL=http://localhost:3000
API_TIMEOUT=30000
WIFI_SSID=University_WiFi
WIFI_CHECK_INTERVAL=60000
POINTS_PER_HOUR=10
POINTS_PER_TREE=100
DEV_MODE=false
```

### Web (.env.local)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-web-url.com
```

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure `CLIENT_URL` is set correctly in backend
2. **Build failures**: Check Node.js version compatibility
3. **Database connection**: Verify MongoDB URI and network access
4. **Mobile app crashes**: Check API endpoint URLs in mobile .env

### Support

- Railway: [docs.railway.app](https://docs.railway.app)
- Expo: [docs.expo.dev](https://docs.expo.dev)
- Vercel: [vercel.com/docs](https://vercel.com/docs)

## Quick Deploy Commands

```bash
# Deploy backend to Render (recommended)
# 1. Connect GitHub repo to render.com dashboard
# 2. Set root directory to UniTree/server
# 3. Deploy automatically

# Deploy backend to Vercel (serverless)
cd UniTree/server
npm i -g vercel
vercel --prod

# Build mobile app
cd UniTree/mobile
npm install -g @expo/eas-cli
eas build --platform android

# Deploy web to Vercel
cd UniTree/web
vercel --prod
```

Your UniTree app will be live and ready for students to start earning points for attending classes! 🌱 