# WiFi Time Tracking System Update

## Overview

The WiFi tracking system has been updated to implement a more comprehensive time tracking approach with periodic resets and cumulative time management.

## New User Model Fields

### Time Tracking Fields
- `totalTimeConnected` (Number, minutes) - Total accumulated WiFi connection time (never resets)
- `monthTimeConnected` (Number, minutes) - Connection time for current month (resets monthly)
- `weekTimeConnected` (Number, minutes) - Connection time for current week (resets weekly)
- `dayTimeConnected` (Number, minutes) - Connection time for current day (resets daily)

### Reset Tracking Fields
- `lastDayReset` (Date) - Last time the daily counter was reset
- `lastWeekReset` (Date) - Last time the weekly counter was reset
- `lastMonthReset` (Date) - Last time the monthly counter was reset

## Key Changes

### 1. Session Flow Updates

**Before:**
- Points awarded periodically during session (every hour)
- Points also awarded at session end for remaining time
- Complex tracking of `hoursAlreadyAwarded`

**After:**
- Session duration is added to all time tracking fields when session ends
- Points are awarded based on **total accumulated time milestones**
- Points only awarded when crossing complete hour thresholds in `totalTimeConnected`

### 2. Point Award Logic

**New Logic:**
- Points = 100 per complete hour of `totalTimeConnected`
- If user has 2.8 hours total → 200 points earned
- When session ends and pushes total to 3.2 hours → +100 points awarded
- This encourages long-term engagement rather than session-based rewards

### 3. Time Period Resets

**Daily Reset:** At midnight (00:00)
**Weekly Reset:** At start of week (Monday 00:00)
**Monthly Reset:** At start of month (1st day 00:00)

The `checkAndResetTimePeriods()` method automatically handles these resets.

## New API Endpoints

### GET `/api/wifi/time-tracking`
Returns detailed time tracking statistics:
```json
{
  "timeTracking": {
    "day": { "minutes": 180, "hours": 3, "progress": 0 },
    "week": { "minutes": 720, "hours": 12, "progress": 50 },
    "month": { "minutes": 1800, "hours": 30, "progress": 25 },
    "total": { "minutes": 5400, "hours": 90, "progress": 75 }
  },
  "pointsFromTotalTime": 9000,
  "nextHourReward": 100,
  "minutesToNextReward": 15
}
```

## Updated API Endpoints

### POST `/api/wifi/end` - Session End
**New Response Format:**
```json
{
  "session": { /* session object */ },
  "pointsAwarded": 100,
  "newHoursAwarded": 1,
  "sessionDurationMinutes": 75,
  "totalTimeConnected": 5475,
  "totalHoursCompleted": 91,
  "timeTracking": {
    "day": 255,
    "week": 795,
    "month": 1875,
    "total": 5475
  }
}
```

### GET `/api/wifi/active` - Active Session
**New Response Format:**
```json
{
  /* session fields */,
  "currentTotalTimeMinutes": 5400,
  "currentTotalHours": 90,
  "potentialTotalTimeMinutes": 5475,
  "potentialTotalHours": 91,
  "potentialNewHours": 1,
  "potentialPoints": 100,
  "minutesToNextReward": 25,
  "progressToNextReward": 58,
  "timeTracking": {
    "day": 180,
    "week": 720,
    "month": 1800,
    "total": 5400
  }
}
```

### GET `/api/wifi/stats` - Statistics
Now uses user time tracking fields instead of calculating from sessions:
```json
{
  "today": { "duration": 3.0, "points": 300 },
  "week": { "duration": 12.0, "points": 1200 },
  "month": { "duration": 30.0, "points": 3000 },
  "total": { "duration": 90.0, "points": 9000 }
}
```

## Removed Features

### Periodic Point Awards
- Removed `/api/wifi/award-periodic` endpoint
- No more periodic point awarding during sessions
- Simplified session management

### WifiSession Model Changes
- Removed `hoursAlreadyAwarded` field
- Sessions now only track start/end times and final points awarded

## User Model Methods

### `addConnectionTime(minutes)`
- Automatically checks and resets time periods if needed
- Adds time to all tracking fields (day, week, month, total)
- Saves the user document

### `checkAndResetTimePeriods()`
- Checks if day/week/month boundaries have been crossed
- Resets appropriate time counters to 0
- Updates reset tracking timestamps

## Migration

A migration script has been created: `src/scripts/migrateTimeTrackingFields.js`
- Adds new fields to existing users with default values
- Can be run safely multiple times
- Run with: `node src/scripts/migrateTimeTrackingFields.js`

## Benefits

1. **Long-term Engagement:** Rewards cumulative time rather than individual sessions
2. **Clear Progress:** Users can see daily/weekly/monthly progress
3. **Simplified Logic:** No complex periodic tracking during sessions
4. **Better Analytics:** Granular time tracking for different periods
5. **Automatic Resets:** Time periods reset automatically without manual intervention

## Example Scenario

User logs in and connects to WiFi:
1. Current total time: 2 hours 45 minutes (165 minutes)
2. Current points from total time: 200 points
3. Session duration: 30 minutes
4. After session: 3 hours 15 minutes (195 minutes)
5. New total hours: 3 complete hours
6. Points awarded: 100 points (for crossing the 3-hour milestone)
7. New total points from WiFi: 300 points 