# Firebase Authentication Implementation

## Overview

The UniTree app has been updated to use Firebase Authentication instead of the previous `@react-native-google-signin/google-signin` implementation, while maintaining the exact same 2-step signup process.

## Changes Made

### Mobile App (`UniTree/mobile/`)

1. **Dependencies Added:**
   - `@react-native-firebase/app` - Firebase core
   - `@react-native-firebase/auth` - Firebase authentication
   - Kept `@react-native-google-signin/google-signin` (required by Firebase for Google auth)

2. **New Files:**
   - `src/config/firebase.js` - Firebase configuration
   - `src/services/FirebaseAuthService.js` - Firebase authentication service
   - `ios/GoogleService-Info.plist` - iOS Firebase configuration

3. **Updated Files:**
   - `src/context/AuthContext.js` - Updated Google auth to use Firebase tokens
   - `src/screens/auth/LoginScreen.js` - Updated to use FirebaseAuthService
   - `src/screens/auth/RegisterScreen.js` - Updated to use FirebaseAuthService
   - `app.config.js` - Added Firebase plugin
   - `package.json` - Added Firebase dependencies

### Server (`UniTree/server/`)

1. **Dependencies Added:**
   - `firebase-admin` - Firebase Admin SDK for token verification

2. **New Files:**
   - `src/config/firebase.js` - Firebase Admin configuration
   - `src/middleware/firebaseAuth.js` - Firebase token verification middleware

3. **Updated Files:**
   - `src/routes/auth.js` - Updated Google auth endpoint to verify Firebase tokens
   - `src/models/User.js` - Added `firebaseUid` field

## Authentication Flow

### 2-Step Signup Process (Maintained)

**Step 1: Email Verification**
- User enters their university email
- System validates email exists in students collection
- Returns student data if valid

**Step 2: Complete Registration**
- User fills in nickname, password, university
- Creates account with validated student information

### Firebase Google Authentication

**For Existing Users:**
1. User clicks "Sign in with Google"
2. Firebase handles Google OAuth
3. Mobile app gets Firebase ID token
4. Token sent to backend for verification
5. Backend verifies token with Firebase Admin SDK
6. User logged in directly

**For New Users:**
1. User clicks "Sign up with Google"
2. Firebase handles Google OAuth
3. Mobile app gets Firebase ID token
4. Token sent to backend for verification
5. Backend checks if user exists
6. If not, redirects to Step 2 of registration
7. User completes registration with Firebase UID stored

## Configuration

### Mobile App Firebase Config

Located in `src/config/firebase.js`:
```javascript
const firebaseConfig = {
  projectId: 'unitree-462606',
  appId: '1:535835927643:android:dummy',
};
```

### Server Firebase Config

Located in `src/config/firebase.js`:
```javascript
const firebaseConfig = {
  projectId: 'unitree-462606',
};
```

## Security

1. **Token Verification:** All Firebase ID tokens are verified on the server
2. **User Validation:** Email must exist in students collection
3. **Token Matching:** Server ensures token belongs to claimed user
4. **Firebase UID Storage:** Optional storage for future Firebase features

## Development Setup

1. **Mobile:** Firebase configuration is already included
2. **Server:** Works without service account in development
3. **Production:** Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

## Benefits of Firebase Implementation

1. **Enhanced Security:** Tokens are cryptographically signed and verified
2. **Better Integration:** Native Firebase SDK integration
3. **Scalability:** Firebase handles OAuth complexity
4. **Future-Ready:** Can easily add other Firebase services
5. **Maintained Flow:** Preserves existing 2-step signup process

## Testing

The implementation maintains backward compatibility:
- Email/password login works unchanged
- 2-step registration process identical
- Google authentication more secure with Firebase
- All existing user data preserved

## Firebase Project Details

- **Project ID:** unitree-462606
- **Project Number:** 535835927643
- **Web Client ID:** 535835927643-ek93pkhrt822381p7ugl8ib8e4a4q3js.apps.googleusercontent.com 