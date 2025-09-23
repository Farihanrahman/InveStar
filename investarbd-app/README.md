# InvestarBD Web App (Android)

A minimal Android WebView wrapper for `https://www.investarbd.com/` with:
- Pull-to-refresh
- Top progress bar
- Back navigation
- File upload (system picker)
- Geolocation prompts
- Downloads via Android DownloadManager

## Requirements
- Android Studio (Ladybug or newer)
- Android SDK Platform 34
- JDK 17

## Open & Run (Android Studio)
1. Open Android Studio → Open → select `investarbd-app`.
2. Let Gradle sync and install any suggested SDKs.
3. Connect a device or start an emulator.
4. Run the `app` configuration.

## CLI Build (optional)
If you have Gradle and the Android SDK configured:
```bash
cd investarbd-app
gradle :app:assembleDebug
```
On first sync, Android Studio will add a Gradle wrapper so you can also use:
```bash
./gradlew :app:installDebug
```

## Notes
- Allow location when prompted to enable geolocation features on the site.
- File uploads are supported via the system picker.
- Downloads are handled by the system DownloadManager and appear in notifications.

## Package
`com.investarbd.webapp`

## Start URL
`https://www.investarbd.com/`