# Codemagic Cloud Build Setup for Nervi

This guide walks you through building iOS and Android apps in the cloud using Codemagic (no Mac needed!).

---

## Prerequisites

### 1. Apple Developer Account
- Sign up at https://developer.apple.com ($99/year)
- You need this to publish iOS apps and use push notifications

### 2. Google Play Developer Account (Optional - for Android)
- Sign up at https://play.google.com/console ($25 one-time fee)
- Only needed if you want to publish on Google Play

---

## Step 1: Initialize Capacitor iOS Project

First, we need to create the iOS project files (even without a Mac):

```bash
npx cap add ios
```

This creates the `ios/` directory with Xcode project files.

---

## Step 2: Set Up Codemagic Account

1. Go to https://codemagic.io
2. Click **"Sign up for free"**
3. Sign in with GitHub
4. Authorize Codemagic to access your GitHub repos

---

## Step 3: Add Your Repository

1. In Codemagic dashboard, click **"Add application"**
2. Select **GitHub** as your repository source
3. Choose your **nervi** repository
4. Select **"Capacitor"** as the project type
5. Click **"Finish: Add application"**

---

## Step 4: Configure iOS Code Signing

This is the trickiest part - you need Apple certificates.

### Option A: Automatic Code Signing (Easiest)

1. In Codemagic, go to your app → **iOS code signing**
2. Click **"Enable automatic code signing"**
3. Enter your **Apple Developer Portal credentials**:
   - Apple ID email
   - App-specific password (generate at appleid.apple.com)
4. Codemagic will automatically:
   - Create certificates
   - Create provisioning profiles
   - Handle code signing

### Option B: Manual Code Signing (More Control)

If you prefer manual control, see the detailed guide at:
https://docs.codemagic.io/yaml-code-signing/signing-ios/

---

## Step 5: Set Up App Store Connect API Key

For automatic TestFlight uploads:

1. Go to https://appstoreconnect.apple.com
2. Navigate to **Users and Access → Keys**
3. Click **"+"** to generate a new key
4. Give it **Admin** access
5. Download the `.p8` key file
6. Note down:
   - **Key ID** (e.g., `ABC123XYZ`)
   - **Issuer ID** (found at top of page)

7. In Codemagic:
   - Go to app settings → **Environment variables**
   - Add these variables:
     - `APP_STORE_CONNECT_KEY_IDENTIFIER` → Your Key ID
     - `APP_STORE_CONNECT_ISSUER_ID` → Your Issuer ID
     - `APP_STORE_CONNECT_PRIVATE_KEY` → Contents of .p8 file (secure)

---

## Step 6: Update codemagic.yaml

The `codemagic.yaml` file is already created. Just update:

**Line 9:** Change email recipient
```yaml
recipients:
  - your-email@example.com  # Change this!
```

---

## Step 7: Update Capacitor Config

Make sure `capacitor.config.ts` has correct app info:

```typescript
const config: CapacitorConfig = {
  appId: 'com.nervi.app',
  appName: 'Nervi',
  webDir: 'out',
  server: {
    url: 'https://nervi.app',
    cleartext: true
  },
  // ... rest of config
};
```

---

## Step 8: Create App in App Store Connect

Before building, create the app listing:

1. Go to https://appstoreconnect.apple.com
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in:
   - **Platform:** iOS
   - **Name:** Nervi
   - **Bundle ID:** `com.nervi.app` (must match capacitor.config.ts)
   - **SKU:** `nervi-app-001` (any unique identifier)
   - **User Access:** Full Access

---

## Step 9: Set Up Push Notification Entitlements

### 9.1 Enable Push Notifications in Apple Developer

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Find your app ID (`com.nervi.app`)
3. Edit it and enable **"Push Notifications"**
4. Save

### 9.2 Create APNs Authentication Key

1. Go to https://developer.apple.com/account/resources/authkeys/list
2. Click **"+"** to create a new key
3. Name it "Nervi APNs Key"
4. Enable **"Apple Push Notifications service (APNs)"**
5. Click **"Continue"** → **"Register"**
6. Download the `.p8` file
7. **Save these values** (you'll need them for your server):
   - **Key ID** (e.g., `ABC123XYZ`)
   - **Team ID** (found in Account settings)
   - **Key file path** (save the .p8 file securely)

### 9.3 Add APNs Credentials to Your Server

Update your `.env.local` (or production environment variables):

```bash
# APNs Configuration
APNS_KEY_ID=ABC123XYZ
APNS_TEAM_ID=TEAM123
APNS_KEY_PATH=/path/to/AuthKey_ABC123XYZ.p8
# OR
APNS_KEY_CONTENT="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

---

## Step 10: Build iOS App on Codemagic

1. In Codemagic, go to your app
2. Click **"Start new build"**
3. Select **"ios-workflow"**
4. Click **"Start build"**

Codemagic will:
- Install dependencies
- Build Next.js app
- Sync with Capacitor
- Build iOS app with Xcode
- Sign the app
- Upload to TestFlight

**Build time:** 10-20 minutes

---

## Step 11: Test on TestFlight

Once the build completes:

1. Open **TestFlight app** on your iPhone
2. You should see **Nervi** appear automatically
3. Install and test!

**Push notifications will work natively** - no more PWA issues!

---

## Step 12: Submit to App Store (Optional)

When ready to publish:

1. In App Store Connect, go to your app
2. Click **"+ Version"** to create a new version
3. Fill in app details:
   - Description
   - Screenshots (use iPhone simulator or real device)
   - Privacy policy URL
   - Keywords
4. Submit for review

**Review time:** 1-3 days typically

---

## Android Build (Bonus - Optional)

To also build for Android:

### 1. Add Android Platform
```bash
npx cap add android
```

### 2. Generate Keystore

On Windows:
```bash
keytool -genkey -v -keystore nervi-release-key.keystore -alias nervi -keyalg RSA -keysize 2048 -validity 10000
```

Save the keystore file and password securely!

### 3. Upload Keystore to Codemagic

1. In Codemagic → **Code signing → Android**
2. Upload `nervi-release-key.keystore`
3. Enter keystore password and alias

### 4. Start Android Build

In Codemagic, start build with **"android-workflow"**

---

## Common Issues

### Build Fails: "Code signing error"
- Double-check Apple Developer account credentials
- Make sure Bundle ID matches in all places
- Try automatic code signing first

### Build Fails: "Missing node modules"
- Check that package.json has all dependencies
- Try adding `npm ci` instead of `npm install`

### Push Notifications Don't Work
- Verify APNs key is uploaded to environment variables
- Check that Push Notifications capability is enabled in Apple Developer
- Make sure app Bundle ID matches exactly

---

## Costs

- **Apple Developer:** $99/year (required)
- **Codemagic:**
  - Free tier: 500 build minutes/month (enough for ~25 iOS builds)
  - Pro tier: $40/month for more builds
- **Google Play (optional):** $25 one-time

---

## Next Steps

1. Follow steps 1-10 to get your first iOS build
2. Test on TestFlight
3. Set up APNs for push notifications
4. Submit to App Store when ready
5. (Optional) Build Android version

---

## Support

- Codemagic Docs: https://docs.codemagic.io
- Capacitor Docs: https://capacitorjs.com
- Apple Developer: https://developer.apple.com/support

Need help? Just ask! I can guide you through any of these steps.
