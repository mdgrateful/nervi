# Nervi iOS Build & Codemagic Status – Sync File for Claude

_Last updated: 2025-12-09_

This file summarizes where we are with the **Nervi** app's iOS build pipeline on **Codemagic**, and what has already been configured on the **Apple** side. The goal is so another assistant (Claude) can quickly understand the current state and help finish the pipeline.

---

## 1. Project Overview

- **App name (working):** Nervi (App Store name will probably be `Nervi – AI Healing Companion` or similar)
- **Bundle ID / App ID:** `com.nervi.app`
- **Tech stack:**
  - Next.js web app
  - Capacitor for native wrappers
  - Capacitor iOS project has been created via `npx cap add ios`
  - Workspace path used: `ios/App/App.xcworkspace`
  - Xcode scheme used: `App`

- **Goal:** Build and sign an iOS `.ipa` in Codemagic, then deliver to TestFlight. Android will be handled later via a similar Capacitor-based setup.

---

## 2. Apple Developer / App Store Setup

### 2.1 Apple Developer Account

- Apple Developer account is **Individual** (not Organization).
- Team ID: visible in the UI as something like `8J8N96NXXU` (exact value available in account).

### 2.2 App ID / Bundle ID

- In **Apple Developer → Certificates, Identifiers & Profiles → Identifiers**, an **App ID** has been created:
  - **Type:** App (iOS, iPadOS, etc.)
  - **Bundle ID (Explicit):** `com.nervi.app`
  - **Capabilities:**
    - **Push Notifications** has been enabled.
    - No other special capabilities enabled yet (this is intentional to keep things simple).

### 2.3 App Store Connect App

- In **App Store Connect → My Apps**, an app entry has been or will be created with:
  - **Name:** something like `Nervi – AI Healing Companion`
  - **Platform:** iOS
  - **Bundle ID:** `com.nervi.app`
  - **SKU:** e.g. `nervi-app-001`
  - **User Access:** Full

(Naming details can be tweaked later; the important part is that the app uses `com.nervi.app`.)

### 2.4 APNs (Push Notifications) Key

- In **Apple Developer → Certificates, Identifiers & Profiles → Keys**, an **APNs Authentication Key** has been created:
  - Environment: **Sandbox**
  - Key restriction: **Team Scoped (All Topics)**
  - The `.p8` key file has been downloaded and stored locally.
  - The **Key ID** and **Team ID** are known and will be used later for server-side push configuration (not yet wired into any backend).

### 2.5 App Store **Provisioning Profile**

- In **Apple Developer → Certificates, Identifiers & Profiles → Profiles**, an **App Store provisioning profile** has been created for Nervi:
  - **Name:** `NerviAppStoreProvisional` (or similar)
  - **Type:** Distribution → App Store
  - **App ID:** `com.nervi.app`
  - **Certificate:** An Apple Distribution certificate for this developer account.
- The `.mobileprovision` file has been downloaded and **uploaded to Codemagic** under:
  - **Teams → Code signing identities → iOS provisioning profiles**
  - So Codemagic now has a profile that matches `com.nervi.app` + `app_store` distribution.

---

## 3. Codemagic Setup

### 3.1 Repository & App

- Codemagic is connected to the GitHub repo: `github.com/mdgrateful/nervi`.
- The app entry in Codemagic is named **`nervi`**.
- Configuration is driven by a **`codemagic.yaml`** file stored at the root of the repository.
- When starting a build:
  - Branch: `main`
  - File workflow: `iOS Build` (this maps to `ios-workflow` in `codemagic.yaml`).

### 3.2 Environment Variables in Codemagic

There are some env vars configured (may or may not still be needed depending on whether we rely on Apple ID or pure API key auth):

- `APP_STORE_CONNECT_USERNAME` – Apple ID email (secure)
- `APP_STORE_CONNECT_PASSWORD` – App-specific password (secure)
- Additionally, an **App Store Connect API key** has been created and connected in:
  - **Teams → Integrations → Apple Developer Portal**
  - This uses:
    - API key name
    - Issuer ID
    - Key ID
    - `.p8` API key file

The main signing path we are relying on now is:

- **Provisioning profile uploaded manually to Codemagic** (`NerviAppStoreProvisional`)
- Optionally **API key** for future automatic operations (but for signing itself, the uploaded profile is enough).

### 3.3 Current `codemagic.yaml` (ESSENTIAL)

The yaml roughly looks like this (may need small tweaks; this is the intended structure):

```yaml
workflows:
  ios-workflow:
    name: iOS Build
    max_build_duration: 60
    environment:
      ios_signing:
        distribution_type: app_store
        bundle_identifier: com.nervi.app
      vars:
        XCODE_WORKSPACE: "ios/App/App.xcworkspace"
        XCODE_SCHEME: "App"
      node: v18.20.0
      # NOTE: `xcode: 15.0` was causing "Unsupported Xcode version" in Codemagic.
      # The next step is to change this to a supported version (e.g., 15.4)
      # or remove it entirely so Codemagic uses its default Xcode image.
      # xcode: 15.0
    scripts:
      - name: Install dependencies
        script: |
          npm ci
      - name: Install Capacitor CLI
        script: |
          npm install -g @capacitor/cli
      - name: Build Next.js
        script: |
          npm run build
      - name: Sync Capacitor
        script: |
          npx cap sync ios
      - name: Set up code signing settings on Xcode project
        script: |
          xcode-project use-profiles
      - name: Build iOS app
        script: |
          xcode-project build-ipa             --workspace "$XCODE_WORKSPACE"             --scheme "$XCODE_SCHEME"
    artifacts:
      - build/ios/ipa/*.ipa
      - /tmp/xcodebuild_logs/*.log
    publishing:
      email:
        recipients:
          - your-email@example.com
        notify:
          success: true
          failure: true

  android-workflow:
    name: Android Build
    max_build_duration: 60
    environment:
      android_signing:
        - nervi_keystore
      groups:
        - google_play
      vars:
        PACKAGE_NAME: "com.nervi.app"
      node: v18.20.0
    scripts:
      - name: Install dependencies
        script: |
          npm ci
      - name: Install Capacitor CLI
        script: |
          npm install -g @capacitor/cli
      - name: Build Next.js
        script: |
          npm run build
      - name: Sync Capacitor
        script: |
          npx cap sync android
      - name: Build Android app
        script: |
          cd android
          ./gradlew assembleRelease
    artifacts:
      - android/app/build/outputs/**/*.apk
      - android/app/build/outputs/**/*.aab
    publishing:
      email:
        recipients:
          - your-email@example.com
        notify:
          success: true
          failure: true
      google_play:
        credentials: $GCLOUD_SERVICE_ACCOUNT_CREDENTIALS
        track: internal
        submit_as_draft: true

credentials:
  app_store_connect:
    apple_id: $APP_STORE_CONNECT_USERNAME
    password: $APP_STORE_CONNECT_PASSWORD
```

> **Important:** The key issue right now is the `xcode` line. It is currently set to `15.0`, which Codemagic reports as **Unsupported Xcode version: 15.0**. We need to either:
> - Change it to a supported version (e.g., `xcode: 15.4`), or
> - Remove the `xcode:` line entirely and let Codemagic choose a default supported version.

The rest of the yaml (workspace, scheme, ios_signing, scripts) appears structurally correct for a Capacitor iOS build.

---

## 4. Current Error History

We’ve progressed through several typical errors:

1. **“No matching profiles found for bundle identifier `com.nervi.app` and distribution type `app_store`”**
   - Cause: No App Store provisioning profile existed for `com.nervi.app`.
   - Fix: Created profile `NerviAppStoreProvisional` in Apple Developer, then uploaded it to Codemagic.

2. **“Unsupported Xcode version: 15.0”** (current blocking error)
   - Cause: `xcode: 15.0` is specified in `codemagic.yaml`, but Codemagic no longer supports Xcode 15.0 on their build images.
   - Next fix: Update `codemagic.yaml` in GitHub:
     - Edit the file on the `main` branch.
     - Change `xcode: 15.0` → `xcode: 15.4` **or** delete the `xcode:` line.
     - Commit directly to `main`.
     - In Codemagic, refresh the config, then re-run the iOS Build workflow.

After that change, the next build will either:
- Succeed and produce a signed `.ipa`, or
- Fail with a new error (likely related to workspace path, scheme, or some missing dependency). Those can be debugged step-by-step from the next log.

---

## 5. Open Questions / Next Steps (for Claude or any assistant)

1. **Update `codemagic.yaml` Xcode version**
   - Ensure the `main` branch on GitHub has `xcode: 15.4` or no `xcode:` line at all.
   - Confirm Codemagic is reading the updated yaml (refresh in Settings).
   - Re-run `ios-workflow` and see whether the “Unsupported Xcode version” error disappears.

2. **Verify workspace & scheme**
   - Confirm that in the generated Xcode project (`ios/App/`):
     - Workspace: `App.xcworkspace`
     - Scheme: `App`
   - Adjust `XCODE_WORKSPACE` or `XCODE_SCHEME` if needed to match actual values.

3. **If builds still fail**
   - Inspect the Codemagic build log for the FIRST red error in the Xcode/Capacitor step.
   - Fix whatever that indicates (missing configuration, path issue, etc.).

4. **Once we have a successful `.ipa`**
   - Decide whether to:
     - Upload manually via **Transporter** or **App Store Connect** web UI, or
     - Add an `app_store_connect` publishing block using the App Store Connect API key to let Codemagic upload to TestFlight automatically (this is optional at this stage).

5. **Later**
   - Wire up APNs credentials in the backend for real push notifications.
   - Configure Android signing and Codemagic Android workflow (using a keystore).

---

This file should give Claude all the context needed to understand where Nervi’s iOS build pipeline stands today and what the immediate next debugging steps should be (starting at fixing the Xcode version in `codemagic.yaml`).

