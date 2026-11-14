# Mobile development quick reference

The complete, step-by-step Windows setup is in [README.md](./README.md). It covers cloning, installing npm dependencies, Android Studio/JDK setup, release signing, permissions, and troubleshooting.

## Web development

```powershell
npm ci
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). Keep the terminal open while using the app; press `Ctrl+C` to stop it.

## Android build and test

Requirements: Node.js 22 LTS or newer LTS, Android Studio with Android SDK Platform 36, and JDK 17 or newer. The project was built using JDK 21.

From the project root in PowerShell:

```powershell
$env:JAVA_HOME = "C:\path\to\your\jdk-21"
npm ci
npm run mobile:build
Set-Location ".\android"
.\gradlew.bat testDebugUnitTest assembleRelease
```

The generated APK is `android\app\build\outputs\apk\release\app-release.apk`. Without a private release keystore configured, this local build uses the Android debug key. For store or in-place update releases, configure and protect your own keystore as explained in the README.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run mobile:build` | Build web code and sync it to Android |
| `npm run mobile:sync` | Sync already-built web assets to Android |
| `npm run mobile:open` | Open the native project in Android Studio |
| `.\gradlew.bat testDebugUnitTest` | Run Android unit tests (from `android\`) |
| `.\gradlew.bat assembleRelease` | Build the APK (from `android\`) |

## Android app limits

App limits use the native Accessibility service to notice selected apps and return to Home when their configured limits are reached. They also use Usage Access to read app usage. Users must enable both permissions in Android Settings. This feature does not force-stop apps, and Android manufacturers may limit background services.

Security-sensitive apps (including some banking apps) may refuse to open while the Accessibility service is enabled. Daily Tracker's **Pause all** only pauses enforcement; it does not turn off the Android service. Disable the service in Android **Settings → Accessibility → Downloaded/Installed apps** while using a banking app, then re-enable it afterward if needed. If avoiding this service conflict is more important than Daily Tracker's automatic blocking, leave it disabled and use Android's **Digital Wellbeing** Focus mode/App timers instead. See the README for the full explanation.

## Where to look

- `capacitor.config.ts` — app identity and web output folder.
- `android/app/src/main/AndroidManifest.xml` — native app and service declarations.
- `android/app/src/main/java/com/dailytracker/app/` — native stopwatch and app-limit services.
- `src/components/` — mobile UI components.
- `ANDROID_SETUP_GUIDE.md` — concise Android build instructions.
