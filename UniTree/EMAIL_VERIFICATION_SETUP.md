# Email Verification Setup Guide

## Overview

The UniTree app now includes a 3-step registration process with email verification:

1. **Step 1**: User enters their university email
2. **Step 2**: User enters the 6-digit verification code sent to their email
3. **Step 3**: User completes registration with additional information

## Backend Changes

### New Files Created
- `src/models/EmailVerification.js` - Model for storing verification codes
- `src/utils/emailService.js` - Email service using nodemailer

### New API Endpoints
- `POST /api/auth/send-verification-code` - Sends 6-digit code to email
- `POST /api/auth/verify-email-code` - Verifies the entered code
- `POST /api/auth/resend-verification-code` - Resends verification code

### Updated Endpoints
- `POST /api/auth/register` - Now requires completed email verification

## Frontend Changes

### Updated RegisterScreen.js
- Added verification code step between email entry and registration
- Added countdown timer for resend functionality
- Added proper error handling and loading states
- Updated UI to handle 3 steps instead of 2

## Email Configuration

### Development
The app uses Ethereal Email for testing in development mode. No configuration needed.

### Production
Add these environment variables to your `.env` file:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password (not your regular password)

## Features

### Security Features
- 6-digit verification codes
- 10-minute expiration time
- Maximum 5 attempts per code
- Rate limiting (1 minute between code requests, 30 seconds for resend)
- Automatic cleanup of expired codes

### User Experience
- Beautiful HTML email templates
- Countdown timer for resend button
- Clear error messages
- Loading states for all actions
- Welcome email after successful registration

## Testing

Run the email test script:
```bash
cd UniTree/server
node test-email.js
```

This will test both verification and welcome email functionality.

## Email Templates

The emails include:
- UniTree branding
- Clear verification code display
- Helpful next steps
- Professional styling
- Responsive design

## Database

The `EmailVerification` collection stores:
- Email address
- Verification code
- Attempt count
- Expiration time
- Verification status

Documents are automatically deleted after expiration or successful verification.

## Error Handling

The system handles:
- Invalid emails
- Expired codes
- Maximum attempts exceeded
- Network failures
- Email service failures

All errors provide user-friendly messages and appropriate HTTP status codes.

## Integration

The email verification integrates seamlessly with:
- Existing authentication flow
- Google sign-up (skips verification for Google users)
- Student database validation
- User registration process

## Maintenance

### Monitoring
- Check email service logs for delivery issues
- Monitor verification attempt rates
- Track failed verification patterns

### Configuration Updates
- Update email templates as needed
- Adjust rate limiting if necessary
- Configure production email service credentials 