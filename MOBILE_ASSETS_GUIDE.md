# Mobile App Assets Guide

## App Icon & Splash Screen Setup

Your InveStar app now has custom branding assets ready for mobile deployment!

### Generated Assets

- **App Icon**: `public/app-icon.png` (1024x1024)
- **Splash Screen**: `public/splash.png` (1920x1920)

### iOS Setup

After running `npx cap add ios` and opening your project in Xcode:

#### App Icon
1. Open your project in Xcode
2. Navigate to `ios/App/App/Assets.xcassets/AppIcon.appiconset`
3. Drag and drop `public/app-icon.png` into the AppIcon asset catalog
4. Xcode will automatically generate all required sizes

#### Splash Screen (Launch Screen)
1. Navigate to `ios/App/App/Assets.xcassets/Splash.imageset`
2. Replace the default splash images with `public/splash.png`
3. Or use Xcode's Launch Screen storyboard to customize further

### Android Setup

After running `npx cap add android` and opening in Android Studio:

#### App Icon
1. Right-click on `res` folder in Android Studio
2. Select **New → Image Asset**
3. Choose **Launcher Icons (Adaptive and Legacy)**
4. Select `public/app-icon.png` as the source
5. Configure foreground, background, and legacy icon
6. Click **Next** → **Finish**

This will generate all required densities:
- `mipmap-mdpi` (48×48)
- `mipmap-hdpi` (72×72)
- `mipmap-xhdpi` (96×96)
- `mipmap-xxhdpi` (144×144)
- `mipmap-xxxhdpi` (192×192)

#### Splash Screen
Android 12+ uses the new Splash Screen API. To configure:

1. Open `android/app/src/main/res/values/styles.xml`
2. Add or modify the splash screen theme:

```xml
<style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
    <item name="android:windowBackground">@drawable/splash</item>
</style>
```

3. Create splash drawable:
   - Copy `public/splash.png` to `android/app/src/main/res/drawable/`
   - Or use Android Studio's **Resource Manager** to import it

4. For Android 12+ native splash:
   - Open `android/app/src/main/res/values/themes.xml`
   - Configure `windowSplashScreenBackground` and `windowSplashScreenAnimatedIcon`

### Quick Asset Generation Script

If you need to generate multiple sizes quickly, you can use this command with ImageMagick:

```bash
# Install ImageMagick first
brew install imagemagick  # macOS
# sudo apt-get install imagemagick  # Linux

# Generate iOS sizes
convert public/app-icon.png -resize 180x180 ios-icon-180.png  # iPhone @3x
convert public/app-icon.png -resize 120x120 ios-icon-120.png  # iPhone @2x
convert public/app-icon.png -resize 167x167 ios-icon-167.png  # iPad @2x

# Generate Android sizes
convert public/app-icon.png -resize 48x48 android-mdpi.png
convert public/app-icon.png -resize 72x72 android-hdpi.png
convert public/app-icon.png -resize 96x96 android-xhdpi.png
convert public/app-icon.png -resize 144x144 android-xxhdpi.png
convert public/app-icon.png -resize 192x192 android-xxxhdpi.png
```

## Push Notifications Setup

Push notifications are configured and ready to use! The app will:
- Request permission on first launch
- Register for push notifications automatically
- Display in-app toasts when notifications arrive
- Handle notification taps

### Backend Integration

To send push notifications from your backend:

1. The `usePushNotifications` hook captures the device token
2. Send this token to your backend server
3. Use Firebase Cloud Messaging (FCM) for Android
4. Use Apple Push Notification service (APNs) for iOS

Example edge function to store tokens:

```typescript
// supabase/functions/register-push-token/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { token, userId } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  const { error } = await supabase
    .from('push_tokens')
    .upsert({ user_id: userId, token, updated_at: new Date() })

  return new Response(JSON.stringify({ success: !error }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Firebase Configuration (Android)

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Add your Android app to Firebase
3. Download `google-services.json`
4. Place it in `android/app/`
5. Add to `android/build.gradle`:
   ```gradle
   classpath 'com.google.gms:google-services:4.3.15'
   ```
6. Add to `android/app/build.gradle`:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

### APNs Configuration (iOS)

1. In Apple Developer Portal, create an APNs key
2. Download the `.p8` key file
3. Note the Key ID and Team ID
4. Configure in Firebase Console under Project Settings → Cloud Messaging

## Color Scheme

The app uses the following brand colors:
- **Theme Color**: `#0a1628` (Dark blue)
- **Primary Gradient**: Gold to blue
- **Accent**: Gold/amber tones

These are reflected in:
- `index.html` theme-color meta tag
- `capacitor.config.ts` splash screen background
- All UI components via the design system

## Testing

### Test Splash Screen
```bash
# iOS
npx cap run ios

# Android
npx cap run android
```

### Test Push Notifications
1. Run app on physical device (not simulator for iOS)
2. Accept notification permissions when prompted
3. Check console for registration token
4. Use Firebase Console or APNs to send test notifications

## Production Checklist

- [ ] Replace app icon with final branded version
- [ ] Test splash screen on multiple device sizes
- [ ] Configure push notification certificates
- [ ] Set up backend to handle push tokens
- [ ] Test notifications on both iOS and Android
- [ ] Verify icon displays correctly on all devices
- [ ] Check splash screen duration and appearance

## Resources

- [Capacitor Assets Documentation](https://capacitorjs.com/docs/guides/splash-screens-and-icons)
- [iOS Human Interface Guidelines - App Icon](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android App Icon Guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
