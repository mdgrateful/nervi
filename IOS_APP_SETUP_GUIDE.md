# Nervi iOS App Setup Guide

Complete guide to building and submitting the Nervi iOS app to the App Store using Capacitor.

---

## Table of Contents

1. [Apple Developer Account Setup](#1-apple-developer-account-setup)
2. [Configure APNs (Push Notifications)](#2-configure-apns-push-notifications)
3. [Database Setup](#3-database-setup)
4. [Build the iOS App](#4-build-the-ios-app)
5. [Test on iOS Simulator/Device](#5-test-on-ios-simulatordevice)
6. [Submit to App Store](#6-submit-to-app-store)
7. [Maintenance & Updates](#7-maintenance--updates)

---

## 1. Apple Developer Account Setup

### Sign Up for Apple Developer Program

1. Go to [developer.apple.com](https://developer.apple.com/)
2. Click **"Account"** and sign in with your Apple ID
3. **Enroll in the Apple Developer Program** ($99/year)
   - Individual or Organization (choose Individual for simplicity)
   - Complete payment
   - **Wait for approval** (usually 24-48 hours)

### Create an App ID

Once approved:

1. Go to **Certificates, Identifiers & Profiles**
2. Click **Identifiers** → **+ (Add)**
3. Select **App IDs** → **Continue**
4. **Register an App ID:**
   - **Description:** Nervi
   - **Bundle ID:** `com.nervi.app` (Explicit - must match capacitor.config.ts)
   - **Capabilities:** Check **Push Notifications**
5. Click **Continue** → **Register**

---

## 2. Configure APNs (Push Notifications)

### Create APNs Authentication Key

This is required to send push notifications from your backend to iOS devices.

1. Go to **Certificates, Identifiers & Profiles**
2. Click **Keys** → **+ (Add)**
3. **Register a New Key:**
   - **Key Name:** Nervi Push Notifications
   - **Check:** Apple Push Notifications service (APNs)
4. Click **Continue** → **Register**
5. **Download the .p8 file** (you can only download this ONCE - keep it safe!)
6. **Note the Key ID** (10-character string like `ABC1234567`)
7. **Note your Team ID** (found in top-right corner of Developer Portal or in Membership section)

### Add APNs Credentials to Environment Variables

You have two options for storing the APNs key:

**Option A: File Path (Recommended for local development)**

```bash
# .env.local
APNS_KEY_PATH=/path/to/AuthKey_ABC1234567.p8
APNS_KEY_ID=ABC1234567
APNS_TEAM_ID=XYZ9876543
```

**Option B: Base64 Content (Recommended for production/Vercel)**

```bash
# Convert .p8 file to base64
cat AuthKey_ABC1234567.p8 | base64

# Add to .env.local
APNS_KEY_CONTENT=<base64-encoded-content>
APNS_KEY_ID=ABC1234567
APNS_TEAM_ID=XYZ9876543
```

**Add to Vercel Environment Variables:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `APNS_KEY_CONTENT`, `APNS_KEY_ID`, and `APNS_TEAM_ID`

---

## 3. Database Setup

### Run SQL Migration for Native Push

Run the SQL migration to add native push support to the database:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `supabase-add-native-push.sql` from your project
3. Copy and paste the entire contents
4. Click **Run**
5. Verify success (should see "Success. No rows returned")

This adds columns for:
- `device_token` - APNs device token
- `platform` - 'ios', 'android', or 'web'
- `push_type` - 'native' or 'web'
- `last_used` - Timestamp for cleanup

---

## 4. Build the iOS App

### Prerequisites

You MUST use a Mac to build iOS apps. You cannot build for iOS on Windows or Linux.

**Install Xcode:**
1. Download Xcode from the Mac App Store (free, ~15GB)
2. Open Xcode and accept the license agreement
3. Install Command Line Tools:
   ```bash
   xcode-select --install
   ```

**Install CocoaPods:**
```bash
sudo gem install cocoapods
```

### Initialize iOS Platform

```bash
# Make sure you're in the project directory
cd nervi-app

# Add iOS platform
npx cap add ios

# This creates an `ios/` folder with the Xcode project
```

### Build the App

```bash
# Sync your web code to the iOS app
npx cap sync ios

# Open the project in Xcode
npx cap open ios
```

This opens Xcode with your iOS project.

---

## 5. Test on iOS Simulator/Device

### Test on Simulator (No Apple Developer Account Needed)

1. In Xcode, select a simulator (e.g., **iPhone 15 Pro**)
2. Click the **Play button** (▶️) to build and run
3. The app will launch in the simulator
4. **Note:** Push notifications DON'T work in simulator - you need a real device

### Test on Real Device (Requires Apple Developer Account)

1. Connect your iPhone via USB
2. In Xcode:
   - Select your device from the device dropdown
   - **Signing & Capabilities** tab:
     - **Team:** Select your Apple Developer account
     - **Bundle Identifier:** com.nervi.app
3. Click **Play (▶️)** to install on your device
4. On your iPhone:
   - Go to **Settings → General → VPN & Device Management**
   - **Trust** your developer certificate
5. Open the Nervi app - push notifications should work!

### Test Push Notifications

1. Open the Nervi app on your device
2. The app will automatically request notification permission
3. Check the device token is saved in your database:
   ```sql
   SELECT * FROM nervi_push_subscriptions WHERE push_type = 'native';
   ```
4. Test sending a push notification from your backend

---

## 6. Submit to App Store

### Prepare for Submission

1. **Create App Store Connect Listing:**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com/)
   - Click **My Apps** → **+ (Add)** → **New App**
   - **Platforms:** iOS
   - **Name:** Nervi
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** com.nervi.app
   - **SKU:** NERVI001
   - Click **Create**

2. **Fill Out App Information:**
   - **App Privacy:** Answer privacy questions based on your privacy policy
   - **Age Rating:** Complete the questionnaire
   - **Description:** Write compelling app description
   - **Keywords:** nervous system, wellness, AI companion, mental health
   - **Support URL:** https://nervi.app/support
   - **Privacy Policy URL:** https://nervi.app/privacy
   - **Screenshots:** Upload screenshots (required for 6.5" and 5.5" displays)
   - **App Icon:** 1024×1024px PNG (no transparency, no rounded corners)

3. **Configure Build Settings in Xcode:**
   - **General** tab:
     - **Version:** 1.0 (user-facing version)
     - **Build:** 1 (incremented with each upload)
     - **Display Name:** Nervi
   - **Signing & Capabilities:**
     - **Automatically manage signing:** ✓
     - **Team:** Your Apple Developer account
     - **Capabilities:** Push Notifications (should already be added)

### Archive and Upload

1. In Xcode, select **Any iOS Device (arm64)** as the build target
2. **Product → Archive**
3. Wait for the archive to complete (5-10 minutes)
4. **Window → Organizer** → **Archives**
5. Select your archive → **Distribute App**
6. **App Store Connect** → **Upload**
7. Follow the wizard (accept defaults)
8. **Upload** (takes 10-20 minutes)

### Submit for Review

1. Go back to App Store Connect
2. Your build should appear under **Build** (may take 5-10 minutes)
3. Select the build
4. **Add for Review**
5. Complete all required fields
6. **Submit for Review**

**Review Timeline:**
- Initial review: 24-48 hours
- Updates: Usually faster (12-24 hours)
- If rejected: Address issues and resubmit

---

## 7. Maintenance & Updates

### Deploying Updates

**The beauty of Capacitor with `server.url` is that most updates are instant:**

1. **Web Updates (No App Store Review Needed):**
   - Make changes to your Next.js code
   - Deploy to Vercel: `git push`
   - Changes appear immediately for all users
   - ✅ API changes, UI updates, new features

2. **Native Updates (Requires App Store Review):**
   - Only needed for:
     - Changing native capabilities (permissions, etc.)
     - Updating Capacitor/plugins
     - Changing app metadata
   - Update version/build number
   - Archive and upload to App Store
   - Submit for review

### Monitoring

**Check APNs logs:**
```javascript
// In your backend
console.log("APNs result:", result);
```

**Monitor device tokens:**
```sql
SELECT
  COUNT(*) as total_devices,
  platform,
  push_type
FROM nervi_push_subscriptions
WHERE last_used > NOW() - INTERVAL '30 days'
GROUP BY platform, push_type;
```

---

## Troubleshooting

### Push Notifications Not Working

1. **Check APNs credentials:**
   ```bash
   # Verify environment variables are set
   echo $APNS_KEY_ID
   echo $APNS_TEAM_ID
   ```

2. **Check device token is saved:**
   ```sql
   SELECT * FROM nervi_push_subscriptions
   WHERE user_id = '<your-user-id>'
   AND push_type = 'native';
   ```

3. **Check App ID has Push Notifications enabled:**
   - Apple Developer Portal → Identifiers → com.nervi.app
   - Should see "Push Notifications" with a green checkmark

4. **Test on real device (not simulator):**
   - Simulators don't support push notifications

### Build Errors in Xcode

1. **Clean build folder:**
   - Product → Clean Build Folder (Shift + Cmd + K)

2. **Update pods:**
   ```bash
   cd ios/App
   pod install
   cd ../..
   ```

3. **Re-sync:**
   ```bash
   npx cap sync ios
   ```

### App Store Rejection

Common reasons:
- **Incomplete metadata:** Fill out all fields in App Store Connect
- **Privacy policy missing:** Ensure https://nervi.app/privacy is live
- **Screenshots don't match app:** Update screenshots
- **Crashes on launch:** Test thoroughly before submitting

---

## Summary Checklist

- [ ] Apple Developer account created ($99/year)
- [ ] App ID created (com.nervi.app)
- [ ] APNs Key (.p8) downloaded and added to environment variables
- [ ] Database migration run (supabase-add-native-push.sql)
- [ ] Xcode installed on Mac
- [ ] iOS platform added (`npx cap add ios`)
- [ ] App tested on real iPhone device
- [ ] Push notifications tested and working
- [ ] App Store Connect listing created
- [ ] Screenshots and metadata uploaded
- [ ] App archived and uploaded to App Store Connect
- [ ] App submitted for review

---

## Need Help?

- **Capacitor Docs:** https://capacitorjs.com/docs/ios
- **Apple Developer:** https://developer.apple.com/support/
- **App Store Connect:** https://developer.apple.com/app-store-connect/

---

**Last Updated:** December 2025
