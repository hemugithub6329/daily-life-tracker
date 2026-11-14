# Windows desktop build

For full setup and troubleshooting—including installing Git/Node.js and cloning the project—see [README.md](./README.md).

## Build on Windows

Install Node.js 22 LTS, open PowerShell in the project folder (the folder containing `package.json`), then run:

```powershell
npm ci
npm run dist:win
```

The build output directory is `release-new\`:

- `Daily Tracker Setup 1.0.0.exe` is the Windows installer.
- `DailyTracker-Portable.exe` is the portable executable.

To build only the portable app:

```powershell
npm run dist:portable
```

Generated executables are local build outputs and are intentionally excluded from GitHub. Build them again from source on the target computer.
