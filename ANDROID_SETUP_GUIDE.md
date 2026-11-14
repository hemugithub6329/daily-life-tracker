# Android setup and build

For a complete fresh-computer guide—including Node.js installation, cloning from GitHub, dependencies, app-limit permissions, signing, and troubleshooting—follow [README.md](./README.md), especially **Part 6: Build the Android APK**.

## Short version (Windows PowerShell)

Requirements: Node.js 22 LTS, Android Studio with Android SDK Platform 36, and JDK 17 or newer. JDK 21 is the tested setup.

From the project root, set `JAVA_HOME` to the JDK folder on your computer, then build and test:

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21"
npm ci
npm run mobile:build
Set-Location ".\android"
.\gradlew.bat testDebugUnitTest assembleRelease
```

The APK is created at `android\app\build\outputs\apk\release\app-release.apk`.

If no private release signing key is configured, the APK uses the standard debug key and is intended for local testing. To sign releases for updates, keep the same private key secure and use the `DAILY_TRACKER_KEYSTORE`, `DAILY_TRACKER_KEYSTORE_PASSWORD`, `DAILY_TRACKER_KEY_ALIAS`, and `DAILY_TRACKER_KEY_PASSWORD` environment variables described in the README. Never commit the keystore or its passwords.

The Android app-limits feature requires the user to grant Usage Access and enable the Daily Tracker Accessibility service in Android Settings. This is separate from build setup.

Some banking apps may refuse to run while any Accessibility service is enabled. The in-app **Pause all** control does not disable Android's Accessibility service. For banking-app compatibility, manually disable **Daily Tracker app limits** in Android **Settings → Accessibility → Downloaded/Installed apps** before opening the banking app, and re-enable it afterward if automatic blocking is desired. Alternatively, leave the service disabled and use Android **Digital Wellbeing** Focus mode/App timers for Android-managed app restrictions. Daily Tracker cannot bypass a bank's security checks or automatically change the Android permission.
