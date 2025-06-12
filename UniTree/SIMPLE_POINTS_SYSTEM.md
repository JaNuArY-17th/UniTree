# Simplified Points System

## Overview

The points system has been reimplemented with a simple, straightforward approach that eliminates complexity and ensures reliable point awarding.

## How It Works

### Basic Rules
- **100 points per complete hour** of university WiFi attendance
- Points are awarded **only when a session ends**
- Only **complete hours** count (59 minutes = 0 points, 60 minutes = 100 points)
- No periodic point awarding during active sessions
- No complex session recovery or pending points logic

### Session Flow

1. **Session Start**
   - User connects to university WiFi
   - Server creates a new `WifiSession` record
   - Mobile app starts tracking session time

2. **During Session**
   - Mobile app shows real-time progress toward next hour
   - No points are awarded during the session
   - Session info shows "potential points" for complete hours

3. **Session End**
   - User disconnects from university WiFi
   - Server calculates complete hours from session duration
   - Points are awarded immediately: `completeHours * 100`
   - User points are updated in database
   - Point transaction record is created

### Data Models

#### WifiSession
```javascript
{
  user: ObjectId,
  ssid: String,
  startTime: Date,
  endTime: Date,
  pointsAwarded: Number  // Points awarded when session ended
}
```

#### Point
```javascript
{
  userId: ObjectId,
  amount: Number,
  type: 'ATTENDANCE',
  description: String,
  metadata: {
    sessionId: ObjectId,
    startTime: Date,
    endTime: Date,
    hoursAwarded: Number
  }
}
```

### API Endpoints

#### Start Session
```
POST /api/wifi/start
Body: { ssid: "University_WiFi" }
```

#### End Session (Awards Points)
```
POST /api/wifi/end
Response: {
  session: WifiSession,
  pointsAwarded: Number,
  completeHours: Number,
  durationMinutes: Number
}
```

#### Get Active Session with Progress
```
GET /api/wifi/active
Response: {
  ...sessionData,
  currentDurationMinutes: Number,
  completeHours: Number,
  minutesToNextHour: Number,
  progressPercent: Number,
  potentialPoints: Number
}
```

## Mobile App Integration

### Session Tracking
- `WifiMonitor.getSessionInfo()` returns current session progress
- Shows potential points for complete hours
- Updates UI every 15 seconds with progress

### Point Display
- Total points: User's accumulated points from database
- Session points: Potential points for current session (not yet awarded)
- Progress bar: Shows progress toward next 100 points

## Benefits of This Approach

1. **Simplicity**: Easy to understand and debug
2. **Reliability**: Points awarded once at session end, no complex timing
3. **Consistency**: Same logic on server and client
4. **No Pending Points**: Eliminates confusion about "pending" vs "awarded" points
5. **Clean Recovery**: Session recovery just shows current progress, no complex syncing

## Example Scenarios

### Scenario 1: 2.5 Hour Session
- Duration: 150 minutes
- Complete hours: 2
- Points awarded: 200
- Remaining 30 minutes don't count

### Scenario 2: 45 Minute Session
- Duration: 45 minutes  
- Complete hours: 0
- Points awarded: 0

### Scenario 3: Multiple Sessions
- Session 1: 1.5 hours → 100 points
- Session 2: 2.2 hours → 200 points
- Total: 300 points

## Migration from Old System

The old complex system with:
- Periodic point awarding
- UserSession tracking
- Pending points logic
- Multiple award endpoints
- Complex session recovery

Has been replaced with this simple approach that maintains the same core functionality (100 points per hour) but with much cleaner implementation. 