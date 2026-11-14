import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import os from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Store data inside the app directory for self-contained portable storage
const DATA_DIR = join(__dirname, 'data')
const DATA_FILE = join(DATA_DIR, 'data.json') // Legacy support

// Structured folder paths
const PATHS = {
  countdown: join(DATA_DIR, 'countdown.json'),
  habits: join(DATA_DIR, 'habits.json'),
  customHabits: join(DATA_DIR, 'custom-habits.json'),
  fixedHabitsList: join(DATA_DIR, 'fixed-habits-list.json'),
  quotes: join(DATA_DIR, 'quotes.json'),
  goals: join(DATA_DIR, 'goals.json'),
  misfits: join(DATA_DIR, 'misfits', 'episodes.json'),
  customMisfitsSubjects: join(DATA_DIR, 'misfits', 'custom-subjects.json'),
  psir: join(DATA_DIR, 'psir', 'episodes.json'),
  customPsirSeasons: join(DATA_DIR, 'psir', 'custom-seasons.json'),
  studyTargets: join(DATA_DIR, 'study-targets.json'),
  homeTasks: join(DATA_DIR, 'home-tasks.json'),
  dailyNotes: join(DATA_DIR, 'daily-notes.json'),
  settings: join(DATA_DIR, 'settings.json')
}

let mainWindow = null

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  
  // Create subdirectories
  const subdirs = ['misfits', 'psir', 'backups']
  subdirs.forEach(dir => {
    const dirPath = join(DATA_DIR, dir)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  })
}

function mergeDateEntries(target, source) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  Object.entries(source).forEach(([key, value]) => {
    if (dateRegex.test(key) && value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = { ...(target[key] || {}), ...value }
    } else if (target[key] === undefined) {
      target[key] = value
    }
  })
}

// Read individual structured files
function readStructuredData() {
  ensureDataDir()
  const data = {}
  
  try {
    // The full data file is the canonical snapshot used by export/import.
    // Prefer it to structured compatibility files so an import replaces, rather
    // than merges with, dates that happen to exist on the current device.
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    }

    // Countdown
    if (fs.existsSync(PATHS.countdown)) {
      data.countdown = JSON.parse(fs.readFileSync(PATHS.countdown, 'utf8'))
    }
    
    // Habits (date-based)
    if (fs.existsSync(PATHS.habits)) {
      const habitsData = JSON.parse(fs.readFileSync(PATHS.habits, 'utf8'))
      mergeDateEntries(data, habitsData)
    }
    
    // Custom habits template
    if (fs.existsSync(PATHS.customHabits)) {
      data.customHabits = JSON.parse(fs.readFileSync(PATHS.customHabits, 'utf8'))
    }
    
    // Fixed habits list
    if (fs.existsSync(PATHS.fixedHabitsList)) {
      data.fixedHabitsList = JSON.parse(fs.readFileSync(PATHS.fixedHabitsList, 'utf8'))
    }
    
    // Quotes
    if (fs.existsSync(PATHS.quotes)) {
      data.quotes = JSON.parse(fs.readFileSync(PATHS.quotes, 'utf8'))
    }
    
    // Goals
    if (fs.existsSync(PATHS.goals)) {
      data.goals = JSON.parse(fs.readFileSync(PATHS.goals, 'utf8'))
    }
    
    // Misfits episodes
    if (fs.existsSync(PATHS.misfits)) {
      data.misfitsEpisodes = JSON.parse(fs.readFileSync(PATHS.misfits, 'utf8'))
    }
    
    // Custom Misfits subjects
    if (fs.existsSync(PATHS.customMisfitsSubjects)) {
      data.customMisfitsSubjects = JSON.parse(fs.readFileSync(PATHS.customMisfitsSubjects, 'utf8'))
    }
    
    // PSIR episodes
    if (fs.existsSync(PATHS.psir)) {
      data.psirEpisodes = JSON.parse(fs.readFileSync(PATHS.psir, 'utf8'))
    }
    
    // Custom PSIR seasons
    if (fs.existsSync(PATHS.customPsirSeasons)) {
      data.customPSIRSeasons = JSON.parse(fs.readFileSync(PATHS.customPsirSeasons, 'utf8'))
    }
    
    // Study targets
    if (fs.existsSync(PATHS.studyTargets)) {
      const targetsData = JSON.parse(fs.readFileSync(PATHS.studyTargets, 'utf8'))
      mergeDateEntries(data, targetsData)
    }

    // Home tasks (date-based)
    if (fs.existsSync(PATHS.homeTasks)) {
      const homeTasksData = JSON.parse(fs.readFileSync(PATHS.homeTasks, 'utf8'))
      mergeDateEntries(data, homeTasksData)
    }
    
    // Daily notes
    if (fs.existsSync(PATHS.dailyNotes)) {
      const notesData = JSON.parse(fs.readFileSync(PATHS.dailyNotes, 'utf8'))
      mergeDateEntries(data, notesData)
    }
    
  } catch (error) {
    console.error('Error reading structured data:', error)
  }
  
  return data
}

// Legacy read function for backward compatibility
function readDataFile() {
  return readStructuredData()
}

// Write data to structured files
function writeStructuredData(data) {
  ensureDataDir()
  
  try {
    // Create backup before writing
    createBackup()
    
    // Countdown
    if (data.countdown !== undefined) {
      fs.writeFileSync(PATHS.countdown, JSON.stringify(data.countdown, null, 2))
    }
    
    // Extract date-based data
    const dateBasedData = {}
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    Object.keys(data).forEach(key => {
      if (dateRegex.test(key)) {
        dateBasedData[key] = data[key]
      }
    })
    
    // Save habits (date-based)
    if (Object.keys(dateBasedData).length > 0) {
      const habitsData = {}
      Object.keys(dateBasedData).forEach(date => {
        if (dateBasedData[date].habits !== undefined || dateBasedData[date].customHabits !== undefined) {
          habitsData[date] = {
            habits: dateBasedData[date].habits,
            customHabits: dateBasedData[date].customHabits
          }
        }
      })
      if (Object.keys(habitsData).length > 0) {
        fs.writeFileSync(PATHS.habits, JSON.stringify(habitsData, null, 2))
      }
    }
    
    // Custom habits template
    if (data.customHabits !== undefined) {
      fs.writeFileSync(PATHS.customHabits, JSON.stringify(data.customHabits, null, 2))
    }
    
    // Fixed habits list
    if (data.fixedHabitsList !== undefined) {
      fs.writeFileSync(PATHS.fixedHabitsList, JSON.stringify(data.fixedHabitsList, null, 2))
    }
    
    // Quotes
    if (data.quotes !== undefined) {
      fs.writeFileSync(PATHS.quotes, JSON.stringify(data.quotes, null, 2))
    }
    
    // Goals
    if (data.goals !== undefined) {
      fs.writeFileSync(PATHS.goals, JSON.stringify(data.goals, null, 2))
    }
    
    // Misfits episodes
    if (data.misfitsEpisodes !== undefined) {
      fs.writeFileSync(PATHS.misfits, JSON.stringify(data.misfitsEpisodes, null, 2))
    }
    
    // Custom Misfits subjects
    if (data.customMisfitsSubjects !== undefined) {
      fs.writeFileSync(PATHS.customMisfitsSubjects, JSON.stringify(data.customMisfitsSubjects, null, 2))
    }
    
    // PSIR episodes
    if (data.psirEpisodes !== undefined) {
      fs.writeFileSync(PATHS.psir, JSON.stringify(data.psirEpisodes, null, 2))
    }
    
    // Custom PSIR seasons
    if (data.customPSIRSeasons !== undefined) {
      fs.writeFileSync(PATHS.customPsirSeasons, JSON.stringify(data.customPSIRSeasons, null, 2))
    }
    
    // Study targets (date-based)
    if (Object.keys(dateBasedData).length > 0) {
      const targetsData = {}
      Object.keys(dateBasedData).forEach(date => {
        if (dateBasedData[date].studyTargets !== undefined) {
          targetsData[date] = { studyTargets: dateBasedData[date].studyTargets }
        }
      })
      if (Object.keys(targetsData).length > 0) {
        fs.writeFileSync(PATHS.studyTargets, JSON.stringify(targetsData, null, 2))
      }
    }

    // Home tasks (date-based)
    if (Object.keys(dateBasedData).length > 0) {
      const homeTasksData = {}
      Object.keys(dateBasedData).forEach(date => {
        if (dateBasedData[date].homeTasks !== undefined) {
          homeTasksData[date] = { homeTasks: dateBasedData[date].homeTasks }
        }
      })
      if (Object.keys(homeTasksData).length > 0) {
        fs.writeFileSync(PATHS.homeTasks, JSON.stringify(homeTasksData, null, 2))
      }
    }
    
    // Daily notes (date-based)
    if (Object.keys(dateBasedData).length > 0) {
      const notesData = {}
      Object.keys(dateBasedData).forEach(date => {
        if (dateBasedData[date].notes !== undefined) {
          notesData[date] = { notes: dateBasedData[date].notes }
        }
      })
      if (Object.keys(notesData).length > 0) {
        fs.writeFileSync(PATHS.dailyNotes, JSON.stringify(notesData, null, 2))
      }
    }
    
    // Also save to legacy file for backup
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
    
    return true
  } catch (error) {
    console.error('Error writing structured data:', error)
    return false
  }
}

// Legacy write function for backward compatibility
function writeDataFile(data) {
  return writeStructuredData(data)
}

// Auto-backup: Keep last 10 backups
function createBackup() {
  try {
    if (!fs.existsSync(DATA_FILE)) return
    
    const backupDir = join(DATA_DIR, 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    const backupFile = join(backupDir, `backup-${timestamp}.json`)
    
    fs.copyFileSync(DATA_FILE, backupFile)
    
    // Keep only last 10 backups
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-'))
      .sort()
      .reverse()
    
    if (backups.length > 10) {
      backups.slice(10).forEach(f => {
        fs.unlinkSync(join(backupDir, f))
      })
    }
  } catch (error) {
    console.error('Backup creation failed:', error)
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, 'electron-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    titleBarStyle: 'default',
    show: false,
  })

  // Check if running from packaged app or development
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // In production, load from the packed app resources
    // Try multiple possible paths since electron-builder may place files differently
    const possiblePaths = [
      join(__dirname, 'dist', 'index.html'),
      join(__dirname, 'dist', 'index.html'),
      join(process.resourcesPath, 'app', 'dist', 'index.html'),
      join(app.getAppPath(), 'dist', 'index.html')
    ]
    
    let indexPath = possiblePaths[0]
    
    // Find the first path that exists
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        indexPath = path
        break
      }
    }
    
    console.log('Loading from:', indexPath)
    console.log('__dirname:', __dirname)
    console.log('resourcesPath:', process.resourcesPath)
    console.log('appPath:', app.getAppPath())
    
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load index.html:', err)
      // Show error in window
      mainWindow.loadURL(`data:text/html,<h1>Error loading app</h1><pre>${err.message}</pre>`)
    })
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('read-file', () => {
  return readDataFile()
})

ipcMain.handle('write-file', (event, data) => {
  return writeDataFile(data)
})

ipcMain.handle('export-data', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'daily-tracker-backup.json',
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  })
  
  if (!result.canceled && result.filePath) {
    const data = readDataFile()
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2))
    return { success: true, path: result.filePath }
  }
  return { success: false }
})

ipcMain.handle('import-data', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile']
  })
  
  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const fileContent = fs.readFileSync(result.filePaths[0], 'utf8')
      const data = JSON.parse(fileContent)
      writeDataFile(data)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
  return { success: false }
})

ipcMain.handle('get-data-path', () => {
  return DATA_FILE
})
