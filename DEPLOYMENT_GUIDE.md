# InveStar Mobile App Deployment Guide

## Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **Git**
- **For iOS:**
  - macOS computer
  - Xcode (latest version from Mac App Store)
  - Apple Developer Account ($99/year)
- **For Android:**
  - Android Studio (latest version)
  - Java Development Kit (JDK 17)
  - Google Play Console Account ($25 one-time fee)

---

## Step 1: Set Up the Project Locally

### 1.1 Export and Clone Repository
```bash
# In Lovable, click "Export to GitHub" to transfer the project
# Then clone from your GitHub repository
git clone [your-github-repo-url]
cd investar-wallet-hub
```

### 1.2 Install Dependencies
```bash
npm install
```

### 1.3 Build the Web Application
```bash
npm run build
```

---

## Step 2: iOS Deployment

### 2.1 Add iOS Platform
```bash
npx cap add ios
npx cap update ios
npx cap sync ios
```

### 2.2 Configure iOS Project

1. **Open in Xcode:**
```bash
npx cap open ios
```

2. **In Xcode:**
   - Select the project in the navigator
   - Under "Signing & Capabilities":
     - Select your Apple Developer Team
     - Change Bundle Identifier if needed: `app.lovable.18b54c75779840a6a2e82cc75383c86d`
   - Update app name to "InveStar"
   - Set minimum iOS version to 13.0 or higher

3. **Configure Info.plist:**
   - Add required permissions (camera, notifications, etc.) if needed
   - Set app display name: "InveStar"

### 2.3 Build and Test

**Test on Simulator:**
```bash
npx cap run ios
```

**Test on Physical Device:**
- Connect iPhone via USB
- Select device in Xcode
- Click "Run" button (⌘R)

### 2.4 Prepare for App Store

1. **Create App Icon Set:**
   - Use 1024x1024 PNG icon
   - Place in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

2. **Create Launch Screen:**
   - Customize in `ios/App/App/Base.lproj/LaunchScreen.storyboard`

3. **Archive the App:**
   - In Xcode: Product → Archive
   - Once archived, click "Distribute App"
   - Choose "App Store Connect"
   - Follow the wizard to upload

4. **App Store Connect:**
   - Go to https://appstoreconnect.apple.com
   - Create new app listing
   - Fill in metadata:
     - Name: InveStar
     - Subtitle: "Investing on automation"
     - Description: [Your app description]
     - Keywords: investment, trading, portfolio, wealth
     - Screenshots (required for multiple device sizes)
   - Submit for review

---

## Step 3: Android Deployment

### 3.1 Add Android Platform
```bash
npx cap add android
npx cap update android
npx cap sync android
```

### 3.2 Configure Android Project

1. **Open in Android Studio:**
```bash
npx cap open android
```

2. **Update Configuration:**
   - Open `android/app/build.gradle`
   - Update:
     ```gradle
     android {
         defaultConfig {
             applicationId "app.lovable.18b54c75779840a6a2e82cc75383c86d"
             minSdkVersion 22
             targetSdkVersion 34
             versionCode 1
             versionName "1.0.0"
         }
     }
     ```

3. **Set App Name:**
   - Edit `android/app/src/main/res/values/strings.xml`:
     ```xml
     <string name="app_name">InveStar</string>
     ```

### 3.3 Create App Icon

1. **Generate Icons:**
   - Use Android Studio: Right-click `res` → New → Image Asset
   - Upload 1024x1024 icon
   - Generate all sizes automatically

### 3.4 Build and Test

**Test on Emulator:**
```bash
npx cap run android
```

**Test on Physical Device:**
- Enable USB debugging on Android device
- Connect via USB
- Run: `npx cap run android -l` (live reload enabled)

### 3.5 Create Signed APK/Bundle

1. **Generate Signing Key:**
```bash
keytool -genkey -v -keystore investar-release-key.keystore -alias investar -keyalg RSA -keysize 2048 -validity 10000
```
   - **CRITICAL:** Save the keystore file and passwords securely!

2. **Configure Signing in Android Studio:**
   - Build → Generate Signed Bundle/APK
   - Choose "Android App Bundle" (recommended for Play Store)
   - Select your keystore
   - Choose "release" build variant

3. **Build Release Bundle:**
```bash
cd android
./gradlew bundleRelease
```
   - Output: `android/app/build/outputs/bundle/release/app-release.aab`

### 3.6 Upload to Google Play Console

1. **Create App in Play Console:**
   - Go to https://play.google.com/console
   - Create new app
   - Fill in app details:
     - App name: InveStar
     - Default language: English
     - App category: Finance

2. **Store Listing:**
   - Short description: "Investing on automation"
   - Full description: [Your app description]
   - Screenshots (minimum 2, required for phone and tablet)
   - Feature graphic (1024x500)
   - App icon (512x512)

3. **Upload App Bundle:**
   - Production → Create new release
   - Upload the `.aab` file
   - Review and rollout

---

## Step 4: Enable Backend Features

### 4.1 Configure OAuth (Google Sign-In)

**For iOS:**
1. In Apple Developer Console:
   - Add "Sign in with Apple" capability
2. In Google Cloud Console:
   - Create iOS OAuth client
   - Add bundle ID

**For Android:**
1. In Google Cloud Console:
   - Create Android OAuth client
   - Add SHA-1 fingerprint:
```bash
keytool -list -v -keystore investar-release-key.keystore -alias investar
```

2. **Update Supabase Auth Settings:**
   - In Lovable Cloud backend, configure OAuth redirect URLs:
     - iOS: `app.lovable.18b54c75779840a6a2e82cc75383c86d://callback`
     - Android: `app.lovable.18b54c75779840a6a2e82cc75383c86d://callback`

### 4.2 Enable Stripe Integration

1. **Configure Stripe:**
   - Get Stripe publishable key and secret key
   - Add to Lovable Cloud secrets
   
2. **Add Native Stripe SDK (if needed):**
   - iOS: Add via CocoaPods
   - Android: Add via Gradle dependencies

---

## Step 5: Testing Checklist

### Pre-Launch Testing
- [ ] Test all authentication flows (email, Google)
- [ ] Test Stripe payment integration
- [ ] Verify wallet connection
- [ ] Test portfolio features
- [ ] Test on multiple device sizes
- [ ] Test offline functionality
- [ ] Verify push notifications (if implemented)
- [ ] Test app icons and splash screens
- [ ] Check app permissions
- [ ] Performance testing (memory, battery)

---

## Step 6: Continuous Updates

### Making Updates After Changes

**After any code changes:**
```bash
# 1. Pull latest code
git pull

# 2. Install dependencies (if package.json changed)
npm install

# 3. Build web app
npm run build

# 4. Sync to native platforms
npx cap sync

# 5. Open in IDE and rebuild
npx cap open ios  # or android
```

### Deploying Updates

**iOS:**
1. Increment version in Xcode
2. Archive and upload to App Store
3. Submit for review

**Android:**
1. Increment `versionCode` and `versionName` in `build.gradle`
2. Build signed bundle
3. Upload to Play Console
4. Release to production

---

## Important Notes

### Hot Reload Configuration
The app is currently configured to load from: `https://18b54c75-7798-40a6-a2e8-2cc75383c86d.lovableproject.com`

**Before production release:**
- Remove the `server` section from `capacitor.config.ts`
- This ensures the app uses local bundled files instead of hot reload

### App Review Guidelines
- **Apple:** Review takes 1-3 days. Ensure compliance with App Store guidelines.
- **Google:** Review takes hours to days. Ensure compliance with Play Store policies.
- Both require privacy policy URL (required for finance apps)

### Required Legal Documents
1. Privacy Policy (mandatory)
2. Terms of Service (recommended)
3. Financial disclosure (required for investment apps)

---

## Support Resources

- **Capacitor Docs:** https://capacitorjs.com/docs
- **Apple Developer:** https://developer.apple.com
- **Google Play Console:** https://support.google.com/googleplay/android-developer
- **Lovable Docs:** https://docs.lovable.dev
- **Lovable Community:** https://discord.com/channels/1119885301872070706/1280461670979993613

---

## Quick Reference Commands

### iOS
```bash
npx cap add ios
npx cap sync ios
npx cap open ios
npx cap run ios
```

### Android
```bash
npx cap add android
npx cap sync android
npx cap open android
npx cap run android
```

### General
```bash
npm run build          # Build web app
npx cap sync          # Sync to all platforms
npx cap update        # Update Capacitor dependencies
```

---

## Troubleshooting

### Common iOS Issues
- **Code signing errors:** Ensure Apple Developer account is properly configured in Xcode
- **Missing permissions:** Add required keys to Info.plist
- **Build failures:** Clean build folder (Shift + ⌘ + K) and rebuild

### Common Android Issues
- **Gradle sync failed:** Update Android Studio and Gradle versions
- **SDK not found:** Configure SDK path in Android Studio settings
- **Signing errors:** Verify keystore path and passwords are correct

---

## Version History

- **v1.0.0** - Initial release
  - Features: Authentication, Portfolio tracking, Wallet integration, Stripe payments
