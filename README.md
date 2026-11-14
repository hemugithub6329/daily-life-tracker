# Daily Life Tracker

Daily Life Tracker is a local-first planner and progress tracker for daily habits, study, goals, notes, and related activities. It uses React and Vite for the interface, Electron for Windows, and Capacitor for Android.

This guide is written for a fresh Windows computer. Follow the sections in order and copy commands into **PowerShell**.

## Start here: choose what you want to do

You do not need to understand or edit the code just to run the app.

- To **try it in a browser**, follow Parts 1–4 and run `npm run dev`.
- To **use the Windows desktop version**, follow Parts 1–4 and run `npm run electron:dev`.
- To **make Windows installer/portable EXE files**, follow Parts 1–3, then Part 5.
- To **make an Android APK**, follow Parts 1–3, then the optional Android section in Part 6. Android builds need additional software.

Run all commands in PowerShell, not inside a browser and not in the Android Studio search box. You can open PowerShell from the Windows Start menu. You do not need to run PowerShell as Administrator.

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

## Part 1: Install the tools (one time per computer)

Use a Windows 10/11 64-bit computer with an internet connection.

1. Install **Git for Windows** from <https://git-scm.com/download/win>. The normal installer choices are fine. If asked how Git should be used from the command line, choose the option that lets Git run from Command Prompt/PowerShell.
2. Install **Node.js 22 LTS** from <https://nodejs.org/>. Download the LTS Windows installer and keep the default options. npm is installed together with Node.js.
3. When both installers finish, close any open PowerShell or VS Code windows, then open a **new** PowerShell window. This makes Windows load the newly installed commands.

4. Copy and paste these three lines into PowerShell, pressing Enter after each line:

```powershell
git --version
node --version
npm --version
```

Each command should print a version number. If PowerShell says a command is not recognized, restart PowerShell; if that does not work, reinstall the named tool and restart the computer. Do not continue until Git, Node.js, and npm work.

**Optional for writing/editing code:** install Visual Studio Code from <https://code.visualstudio.com/>. It is not required to run the app.

**Only if building Android:** also install Android Studio and JDK 21. Those are not needed for the browser or Windows EXE.

## Part 2: Download the project from GitHub

These commands download the project into a `daily-life-tracker` folder inside your Windows Documents folder. Copy and paste each line into PowerShell:

```powershell
Set-Location "$HOME\Documents"
git clone https://github.com/hemugithub6329/daily-life-tracker.git
Set-Location ".\daily-life-tracker"
```

When the command finishes, you are inside the project folder. This public repository can be downloaded without signing into GitHub. If Git reports that the folder already exists, do not clone it again into the same folder; instead open PowerShell and run:

```powershell
Set-Location "$HOME\Documents\daily-life-tracker"
```

### Optional: open the project in VS Code

If you installed VS Code, run this while PowerShell is in the project folder:

```powershell
code .
```

If `code` is not recognized, open VS Code from the Start menu and choose **File → Open Folder**, then select `Documents\daily-life-tracker`. In VS Code, open **Terminal → New Terminal** to enter the commands below. The terminal must be in the folder containing `package.json`.

## Part 3: Install the project packages

This is required once after cloning (and again only when project dependencies change). Make sure the PowerShell prompt is in the project folder, then run:

```powershell
npm ci
```

Wait for the command to finish and for the PowerShell prompt to return. It downloads the project's exact packages from `package-lock.json`; the first install may take several minutes. You need an internet connection. Do not close the window while it is installing.

If it finishes and returns to the prompt, continue to Part 4. npm can print warning messages; a warning is not the same as a failed install. If it ends with `npm ERR!`, save the complete error message and resolve that before continuing. Do not delete `package-lock.json`.

If `npm ci` reports that `package-lock.json` does not match `package.json`, stop and ask the project maintainer to update and commit the lock file.

### Copy-and-paste first run for the Windows desktop app

After Git and Node.js are installed and verified in Part 1, paste this whole block into PowerShell. The last command opens the app and stays running until you press **Ctrl+C**:

```powershell
Set-Location "$HOME\Documents"
git clone https://github.com/hemugithub6329/daily-life-tracker.git
Set-Location ".\daily-life-tracker"
npm ci
npm run electron:dev
```

For later runs, do not clone or reinstall packages again. Use the Part 4 **Run it again on another day** commands.

## Part 4: Run the app

### Run in a web browser

From the project folder:

```powershell
npm run dev
```

Wait until PowerShell prints a local address, usually `http://localhost:5173`. Hold **Ctrl** and click the address, or copy it into Chrome/Edge. Keep the PowerShell window open while using the app. To stop it, click the PowerShell window, press **Ctrl+C**, then confirm if asked.

### Run as a Windows desktop app

Stop the browser server with **Ctrl+C** first if it is still running. In the project folder run:

```powershell
npm run electron:dev
```

This starts the development server and opens the Daily Tracker desktop window. Keep PowerShell open while the app runs. Close the app window, then press **Ctrl+C** in PowerShell to stop the development processes.

### Run it again on another day

You do not need to clone or run `npm ci` again. Open PowerShell and run:

```powershell
Set-Location "$HOME\Documents\daily-life-tracker"
npm run electron:dev
```

Use `npm run dev` instead if you want the browser version. Keep the terminal open until finished using the app.

## Part 5: Build the Windows EXE files (optional)

The Windows installer and portable EXE are created on the Windows computer. First make sure you completed Parts 1–3. From PowerShell in the project folder, run:

```powershell
npm run dist:win
```

Wait for the build to finish and the prompt to return. It first builds the web app, then packages the installer and portable app. Open File Explorer and enter this folder path:

```text
release-new\
```

The configured output names are:

- `Daily Tracker Setup 1.0.0.exe` — installer with Start Menu/desktop shortcut options.
- `DailyTracker-Portable.exe` — portable Windows executable.

Double-click the installer to install Daily Tracker, or double-click the portable EXE to run it without installing. Windows may show a SmartScreen warning because the packages are not code-signed. Only choose **Run anyway** if you built this project yourself and trust the source.

To build only the portable version:

```powershell
npm run dist:portable
```

## Part 6: Build and install the Android APK (optional)

Skip this part if you only need the browser or Windows version. Android builds require Android Studio, Android SDK Platform 36, and JDK 17 or newer. JDK 21 is the tested setup.

1. Install Android Studio from <https://developer.android.com/studio>. In its setup wizard, allow it to install Android SDK tools.
2. Open Android Studio. On the welcome screen choose **More Actions → SDK Manager** (or **Tools → SDK Manager** if a project is open).
3. In **SDK Platforms**, select **Android 16.0 / API 36**. In **SDK Tools**, select Android SDK Build-Tools and Android SDK Platform-Tools. Click **Apply** and wait for installation to finish.
4. Install a JDK 21 from a trusted distributor such as Eclipse Temurin: <https://adoptium.net/temurin/releases/?version=21>. Restart PowerShell after installation.
5. In a new PowerShell window, set `JAVA_HOME` to the actual JDK installation folder. Example only—your installed folder may have a different name:

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21"
```

6. Point Gradle at the Android SDK installed by Android Studio. This is the usual Windows location; if Android Studio installed it somewhere else, replace the path with the SDK Location shown in SDK Manager:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

7. Check that Java is available, then go to the project directory:

```powershell
java -version
Set-Location "$HOME\Documents\daily-life-tracker"
```

8. Build the web part and copy it into Android:

```powershell
npm run mobile:build
```

9. Run Android unit tests and build the APK:

```powershell
Set-Location ".\android"
.\gradlew.bat testDebugUnitTest assembleRelease
```

Wait until Gradle reports `BUILD SUCCESSFUL`. The APK is written to:

```text
android\app\build\outputs\apk\release\app-release.apk
```

10. To install it on your phone, copy `app-release.apk` from the path above to the phone (USB file transfer or a trusted file-sharing method), open it in the phone's Files/Downloads app, and follow Android's install prompts. Android may ask you to allow that file manager to install unknown apps; only allow this for an APK you built from source you trust.

**Important about updates:** the repository does not contain a release keystore. Without your own signing key configured, Gradle signs the APK with the standard debug key. This is for local testing and may not update an APK installed from a differently signed release. Android may require uninstalling the old app first, which can erase its local data; export a backup before uninstalling. To keep installing updates over time, securely back up and use the same private signing key each time.

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

## For maintainers: publish future changes to GitHub

This project is already connected to `https://github.com/hemugithub6329/daily-life-tracker`. After editing code or documentation, open PowerShell in the project folder and review the changed files:

```powershell
git init -b main
git status --short
```

The root `.gitignore` excludes `node_modules`, generated build files, local `data`, installer/APK output, local settings, Firebase configuration, and Android signing keys. Make sure `android/app/release.jks`, any other `.jks`/`.keystore` files, passwords, and personal backup data do **not** appear in the status output. If they do, stop; do not upload them.

To publish reviewed changes:

```powershell
git add .
git status --short
git commit -m "Describe your change"
git push
```

If GitHub asks you to sign in, finish authentication in the browser or Git Credential Manager; never put a password or access token in a Git command. Confirm the upload by refreshing the repository page.

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
