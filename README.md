# Daily Life Tracker

Daily Life Tracker is a local-first planner and progress tracker for daily habits, study, goals, notes, and related activities. It uses React and Vite for the interface, Electron for Windows, and Capacitor for Android.

This guide is written for a fresh Windows computer. Follow the sections in order and copy commands into **PowerShell**.

## What the app does

- **Calendar and daily records:** select a date and work with that date's habits, study targets, notes, home tasks, and study sessions.
- **Habit tracking:** track the built-in habits and add custom habits; see daily progress and streaks.
- **Study time:** run a study stopwatch, see the selected day's saved study time, and reset that day's saved time when needed. On Android, the running timer can continue in a notification.
- **Study targets and home tasks:** create and check off items for a particular day.
- **Calendar and notes:** navigate dates, see habit and study-target progress, and create daily notes.
- **Episode trackers:** track episodes and progress for supported trackers, including Misfits, PSIR, PYQ, and mock tests.
- **Goals and countdown:** manage goals and a countdown.
- **Quotes:** manage motivational quotes shown in the app.
- **Backup and restore:** export or import app data. Backups are important because local data is not automatically uploaded to GitHub.
- **Password recovery:** where a master password is configured, use its saved recovery pattern to reset it.
- **Android app limits:** optionally select installed Android apps and set daily usage limits, allowed time windows, or both. Automatic blocking requires Android Usage Access and the Daily Tracker Accessibility service. When blocked, an app is sent back to Home; it is not force-stopped or uninstalled. This Android feature does not block Windows programs.

Data is stored locally on the device/browser. Different devices do not automatically share data. Use the app's export/import functions to move a backup between devices.

## Part 1: Install the tools

Install these programs first:

1. **Git for Windows:** <https://git-scm.com/download/win>
2. **Node.js 22 LTS:** <https://nodejs.org/> (npm is included with Node.js).
3. **For Android builds only:** Android Studio, Android SDK Platform 36, and a Java Development Kit (JDK). This project has been built with JDK 21. Android Studio can install the Android SDK and tools.

After installing Git and Node.js, close and reopen PowerShell. Check that they work:

```powershell
git --version
node --version
npm --version
```

The Windows app and web app do not require Android Studio or a JDK.

## Part 2: Download the project from GitHub

```powershell
Set-Location "$HOME\Documents"
git clone https://github.com/hemugithub6329/daily-life-tracker.git
Set-Location ".\daily-life-tracker"
```

Because this repository is public, cloning it does not require GitHub sign-in. If you later rename the repository or change its visibility to private, use its **Code → HTTPS** clone address instead.

## Part 3: Install the project packages

Run this from the project folder (the folder containing `package.json`):

```powershell
npm ci
```

Wait until it finishes. This installs the exact JavaScript packages recorded in `package-lock.json`; it may take a few minutes the first time.

If `npm ci` reports that `package-lock.json` does not match `package.json`, stop and ask the project maintainer to update and commit the lock file. Do not delete the lock file as a first fix.

## Part 4: Run the app

### Run in a web browser

```powershell
npm run dev
```

Open the local address printed by Vite (normally <http://localhost:5173>). Keep the PowerShell window open while using the app. Press **Ctrl+C** in that window to stop the server.

### Run as a Windows desktop app

```powershell
npm run electron:dev
```

This starts the local Vite server and opens Electron. Keep the terminal open. Press **Ctrl+C** to stop both processes.

## Part 5: Build the Windows EXE files

On Windows, from the project folder:

```powershell
npm run dist:win
```

The build first creates the web app, then packages the Windows installer and portable app. Look in:

```text
release-new\
```

The configured output names are:

- `Daily Tracker Setup 1.0.0.exe` — installer with Start Menu/desktop shortcut options.
- `DailyTracker-Portable.exe` — portable Windows executable.

To build only the portable version:

```powershell
npm run dist:portable
```

Windows packages may be flagged by Windows SmartScreen because they are not code-signed. Only run builds from source you trust.

## Part 6: Build the Android APK (optional)

Android builds require Android Studio/Android SDK and JDK 17 or newer. This project has been built using JDK 21 and Android SDK Platform 36.

1. Install Android Studio from <https://developer.android.com/studio>.
2. In Android Studio's **SDK Manager**, install **Android SDK Platform 36** and the Android SDK Build-Tools.
3. Install a JDK (JDK 21 is the tested setup).
4. Open a new PowerShell window and go to the project folder.
5. Set `JAVA_HOME` to the JDK folder on your own computer. For example:

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21"
```

Change that path if your JDK is installed somewhere else. Now build and sync the web assets, run Android tests, and build the APK:

```powershell
npm run mobile:build
Set-Location ".\android"
.\gradlew.bat testDebugUnitTest assembleRelease
```

The APK is written to:

```text
android\app\build\outputs\apk\release\app-release.apk
```

The repository does not include a signing key. If you have not configured a private release key, Gradle signs the APK with the standard **debug key**, which is suitable for local testing but not for publishing app updates. Android may require you to uninstall a previously installed APK if its signing key is different; uninstalling can erase that app's local data, so export a backup first.

### Sign Android releases with your own private key

Never upload a keystore or its passwords to GitHub. Keep the original release keystore in a secure place. If an app has already been distributed with a signing key, future updates need the same key.

To sign a release with a private key, open a fresh PowerShell window and set these environment variables for that window. Use your own existing keystore path, passwords, and alias:

```powershell
$env:DAILY_TRACKER_KEYSTORE = "C:\secure-keys\daily-tracker-release.jks"
$env:DAILY_TRACKER_KEY_ALIAS = "your-key-alias"
$secureStorePassword = Read-Host "Keystore password" -AsSecureString
$secureKeyPassword = Read-Host "Key password" -AsSecureString
$env:DAILY_TRACKER_KEYSTORE_PASSWORD = [System.Net.NetworkCredential]::new("", $secureStorePassword).Password
$env:DAILY_TRACKER_KEY_PASSWORD = [System.Net.NetworkCredential]::new("", $secureKeyPassword).Password
Set-Location "C:\path\to\daily-life-tracker"
npm run mobile:build
Set-Location ".\android"
.\gradlew.bat assembleRelease
```

Replace the example paths and alias. The passwords are held in that PowerShell process's environment; close that window when finished. Do not paste passwords into project files or commit them.

Useful Android commands:

```powershell
# Open the native Android project in Android Studio
npm run mobile:open

# After changing React/web code, rebuild and copy assets into Android
npm run mobile:build

# From the android folder, run the native unit tests
.\gradlew.bat testDebugUnitTest
```

For app limits on a phone, grant both permissions in Android Settings: **Usage Access** and **Accessibility → Daily Tracker app limits**. Some Android versions first require **Allow restricted settings** in Daily Tracker's App info page. Permission menu names differ by phone manufacturer.

### App limits, pause/resume, and banking-app compatibility

The **Pause all / Resume** control in Daily Tracker stops or restarts app-limit enforcement inside Daily Tracker. **Pausing does not turn off the Android Accessibility service.** A banking app such as YONO SBI may refuse to run whenever it detects an enabled Accessibility service, even if Daily Tracker's limits are paused. That behavior belongs to the banking app's security policy; Daily Tracker cannot safely make the bank ignore it.

Choose the option that fits the phone user's needs:

1. **Keep Daily Tracker's automatic blocking:** leave its Accessibility service enabled. Some banking or other security-sensitive apps may refuse to open. Before using one of those apps, manually turn off **Daily Tracker app limits** under Android **Settings → Accessibility → Downloaded/Installed apps**. Turn it back on afterward to resume enforcement. The precise Settings path varies by manufacturer. Remember that automatic blocking does not operate while the service is off.
2. **Avoid an Accessibility-service conflict:** do not enable Daily Tracker's Accessibility service. Android's built-in **Digital Wellbeing → Focus mode** can pause chosen apps, often on a schedule, and **App timers** can set daily usage caps. Menu names and features vary by Android version and phone. In this setup, Digital Wellbeing—not Daily Tracker—does the blocking. Daily Tracker cannot remotely switch those Android controls for the user.

**Do not confuse the controls:** the in-app Pause all / Resume button controls Daily Tracker's blocker; the Android Accessibility switch controls whether the service is enabled at all. The current app does not automatically disable or re-enable Android's Accessibility service when a banking app opens. Users must make that choice in Android Settings.

## Copy the project to your own GitHub account

If GitHub already has a blank repository for this project, use its HTTPS URL. If not, create a new repository on GitHub, choose **Private** or **Public**, and leave **Add a README**, `.gitignore`, and license unchecked so the new repository is empty.

From the project folder, review the files before uploading:

```powershell
git init -b main
git status --short
```

The root `.gitignore` excludes `node_modules`, generated build files, local `data`, installer/APK output, local settings, Firebase configuration, and Android signing keys. Make sure `android/app/release.jks`, any other `.jks`/`.keystore` files, passwords, and personal backup data do **not** appear in the status output. If they do, stop before running `git add`.

Then connect the blank GitHub repository and upload the source:

```powershell
git add .
git status --short
git commit -m "Initial project import"
git remote add origin https://github.com/hemugithub6329/daily-life-tracker.git
git push -u origin main
```

For this project, the URL above is already set to the current repository. GitHub will prompt you to authenticate when pushing if needed. If Git says the remote already exists, inspect it with `git remote -v` and use the correct URL before pushing.

After the first upload, future updates are:

```powershell
git add .
git status --short
git commit -m "Describe your change"
git push
```

GitHub is for source code and instructions; it is not a substitute for exporting your personal app data or safely backing up an Android release keystore.

## Project map

```text
src\                         React interface and application logic
  components\                Calendar, trackers, notes, goals, and dialogs
  pages\                     Dashboard and top-level navigation
  utils\                     Date logic, storage, events, navigation, history
android\                     Capacitor Android project and native Java services
public\                      Icons and static web files
scripts\                     Project helper scripts
electron-main.mjs            Electron main process and desktop data I/O
electron-preload.cjs         Small controlled API exposed to the UI
capacitor.config.ts          Capacitor app identity and web output location
vite.config.js               Vite development and production build settings
package.json                 Commands and direct dependencies
package-lock.json            Exact dependency versions for repeatable npm ci
```

## Common fixes

- **`git`, `node`, or `npm` is not recognized:** install it, close PowerShell, open a new PowerShell, and retry the version commands.
- **`npm ci` fails:** check the error and internet connection. If it mentions native build tools, run the install from a fresh PowerShell after Node.js installation. Do not delete the lock file without a reason.
- **The browser page does not open:** make sure `npm run dev` is still running and use the exact URL printed in the terminal.
- **Android says it cannot find Java:** set `$env:JAVA_HOME` to the real JDK installation folder and retry Gradle in that same PowerShell window.
- **Android says the SDK is missing:** install Android SDK Platform 36 in Android Studio's SDK Manager. Open `android` in Android Studio once if you need it to create local SDK configuration.
- **A phone refuses to update the installed APK:** Android only allows an in-place update when the APK uses the same signing key. Export app data before uninstalling an old build.
- **A GitHub push is rejected:** inspect `git status` and `git remote -v`; authenticate with GitHub and make sure the target repository URL is correct.

## License

No license has been selected for this project. Making the repository public lets people view the source, but does not automatically grant permission to reuse or redistribute it. Add a license only after choosing one.

## Project commands

| Command | What it does |
| --- | --- |
| `npm ci` | Installs exact JavaScript dependencies from the lock file |
| `npm run dev` | Starts the browser development server |
| `npm run build` | Builds the web assets into `dist\` |
| `npm run electron:dev` | Runs the desktop app in development |
| `npm run dist:win` | Builds the Windows installer and portable app |
| `npm run dist:portable` | Builds the Windows portable app |
| `npm run mobile:build` | Builds web assets and syncs them to Capacitor |
| `npm run mobile:open` | Opens the Android project in Android Studio |
| `.\gradlew.bat testDebugUnitTest` | Runs Android unit tests (from `android\`) |
| `.\gradlew.bat assembleRelease` | Builds Android APK (from `android\`) |
