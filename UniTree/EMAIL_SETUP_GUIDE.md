# Email Setup Guide - Fix Gmail Authentication Error

## Problem
You're getting the error: `Email transporter verification failed: Invalid login: 535 Authentication failed`

This happens because Gmail requires special authentication for third-party applications.

## Solution: Generate Gmail App Password

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", click on "2-Step Verification"
4. Follow the steps to enable 2FA if not already enabled

### Step 2: Generate App Password
1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", click on "App passwords"
4. You might need to sign in again
5. Click "Select app" and choose "Mail"
6. Click "Select device" and choose "Other (custom name)"
7. Type "UniTree Server" as the name
8. Click "Generate"
9. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Update Environment File
1. Open your `.env` file in the `UniTree/server/` directory
2. Replace the current `EMAIL_PASSWORD` with the App Password:
```
EMAIL_PASSWORD=abcdefghijklmnop
```
(Remove any spaces from the App Password)

### Step 4: Test the Configuration
Run this command from the server directory to test:
```bash
npm run dev
```

## Alternative Solutions

### Option 1: Use a Different Email Service
If you prefer not to use Gmail, you can use other services like:

**Outlook/Hotmail:**
```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

**Custom SMTP:**
```env
EMAIL_SERVICE=custom
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
```

### Option 2: Development Mode (Testing Only)
For development/testing purposes, you can temporarily disable Gmail by removing the EMAIL_USER and EMAIL_PASSWORD from your `.env` file. This will use the ethereal testing service instead.

## Troubleshooting

### If you still get authentication errors:
1. Make sure you copied the App Password correctly (no spaces)
2. Verify 2FA is enabled on your Google account
3. Try generating a new App Password
4. Make sure you're using the Gmail account `greenityclub@gmail.com`

### If emails still don't send:
1. Check the server logs for detailed error messages
2. Verify your internet connection
3. Try using a different email service temporarily

## Security Note
- Never share your App Password
- Store it securely in your `.env` file
- The `.env` file should be in your `.gitignore` to prevent accidental commits 