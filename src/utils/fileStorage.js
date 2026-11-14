// Using IndexedDB for better storage capacity and persistence
// Falls back to localStorage if IndexedDB is not available

const DB_NAME = 'DailyTrackerDB'
const DB_VERSION = 1
const STORE_NAME = 'appData'

const isElectron = () => {
  return window.electronAPI !== undefined
}

// Open IndexedDB connection
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

// Get all data from IndexedDB
const getAll = async () => {
  // First check if we're in Electron mode
  if (isElectron()) {
    try {
      console.log('Using Electron file storage')
      return await window.electronAPI.readFile()
    } catch (error) {
      console.error('Electron readFile failed:', error)
      // Fall through to IndexedDB/localStorage
    }
  }
  
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get('mainData')
      
      request.onsuccess = () => {
        const data = request.result?.data || {}
        db.close()
        resolve(data)
      }
      request.onerror = () => {
        db.close()
        // Fallback to localStorage
        const fallback = localStorage.getItem('dailyTracker_data')
        resolve(fallback ? JSON.parse(fallback) : {})
      }
    })
  } catch (error) {
    console.error('IndexedDB getAll error:', error)
    // Fallback to localStorage
    const fallback = localStorage.getItem('dailyTracker_data')
    return fallback ? JSON.parse(fallback) : {}
  }
}

// Save all data to IndexedDB
const saveAll = async (data) => {
  if (isElectron()) {
    try {
      return await window.electronAPI.writeFile(data)
    } catch (error) {
      console.error('Electron writeFile failed:', error)
      // Fall through to IndexedDB/localStorage
    }
  }
  
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put({ id: 'mainData', data, timestamp: Date.now() })
      
      request.onsuccess = () => {
        db.close()
        // Also backup to localStorage as secondary storage
        localStorage.setItem('dailyTracker_data', JSON.stringify(data))
        resolve(true)
      }
      request.onerror = () => {
        db.close()
        // Fallback to localStorage
        localStorage.setItem('dailyTracker_data', JSON.stringify(data))
        resolve(true)
      }
    })
  } catch (error) {
    console.error('IndexedDB saveAll error:', error)
    // Fallback to localStorage
    localStorage.setItem('dailyTracker_data', JSON.stringify(data))
    return true
  }
}

// Date-specific operations
const getDateData = async (date) => {
  const data = await getAll()
  return {
    habits: data[date]?.habits || {},
    notes: data[date]?.notes || ''
  }
}

const saveDateData = async (date, dateData) => {
  const data = await getAll()
  if (!data[date]) data[date] = {}
  if (dateData.habits !== undefined) data[date].habits = dateData.habits
  if (dateData.notes !== undefined) data[date].notes = dateData.notes
  return await saveAll(data)
}

// Habits - returns object {habitName: boolean}
const getHabits = async (date) => {
  const data = await getAll()
  return data[date]?.habits || {}
}

const saveHabits = async (date, habits) => {
  const data = await getAll()
  if (!data[date]) data[date] = {}
  data[date].habits = habits
  return await saveAll(data)
}

// Custom habits - returns array [{text, completed}]
const getCustomHabits = async (date) => {
  const data = await getAll()
  return data[date]?.customHabits || []
}

const saveCustomHabits = async (date, habits) => {
  const data = await getAll()
  if (!data[date]) data[date] = {}
  data[date].customHabits = habits
  return await saveAll(data)
}

// All custom habits template
const getAllCustomHabits = async () => {
  const data = await getAll()
  return data.customHabits || []
}

const saveAllCustomHabits = async (habits) => {
  const data = await getAll()
  data.customHabits = habits
  return await saveAll(data)
}

// Fixed habits list
const getFixedHabitsList = async () => {
  const data = await getAll()
  return data.fixedHabitsList || null
}

const saveFixedHabitsList = async (list) => {
  const data = await getAll()
  data.fixedHabitsList = list
  return await saveAll(data)
}

// Notes
const getNotes = async (date) => {
  const data = await getAll()
  return data[date]?.notes || ''
}

const getNotesMetadata = async (date) => {
  const data = await getAll()
  const isGloballyLocked = data.masterPasswordHash ? true : false
  return {
    notes: data[date]?.notes || '',
    isLocked: data[date]?.isLocked || false,
    isGloballyLocked: isGloballyLocked && (data[date]?.isLocked || false)
  }
}

const saveNotes = async (date, notes) => {
  const data = await getAll()
  if (!data[date]) data[date] = {}
  data[date].notes = notes
  return await saveAll(data)
}

// Master password functions
const getMasterPassword = async () => {
  const data = await getAll()
  return {
    hash: data.masterPasswordHash || '',
    hint: data.masterPasswordHint || '',
    recoveryPatternHash: data.masterPasswordRecoveryPatternHash || ''
  }
}

const setMasterPassword = async (passwordHash, hint = '', recoveryPatternHash = '') => {
  const data = await getAll()
  data.masterPasswordHash = passwordHash
  data.masterPasswordHint = hint
  if (recoveryPatternHash) data.masterPasswordRecoveryPatternHash = recoveryPatternHash
  return await saveAll(data)
}

const updateMasterPassword = async (newPasswordHash, newHint = '', recoveryPatternHash) => {
  const data = await getAll()
  data.masterPasswordHash = newPasswordHash
  data.masterPasswordHint = newHint
  if (recoveryPatternHash !== undefined) data.masterPasswordRecoveryPatternHash = recoveryPatternHash
  return await saveAll(data)
}

const setMasterPasswordRecoveryPattern = async (patternHash) => {
  const data = await getAll()
  data.masterPasswordRecoveryPatternHash = patternHash
  return await saveAll(data)
}

const deleteMasterPassword = async () => {
  const data = await getAll()
  delete data.masterPasswordHash
  delete data.masterPasswordHint
  delete data.masterPasswordRecoveryPatternHash
  // Also unlock all notes
  Object.keys(data).forEach(key => {
    if (data[key] && typeof data[key] === 'object') {
      data[key].isLocked = false
    }
  })
  return await saveAll(data)
}

const setNoteLocked = async (date, isLocked) => {
  const data = await getAll()
  if (!data[date]) data[date] = {}
  
  // Only allow locking if note has content
  if (isLocked && (!data[date].notes || data[date].notes.trim().length === 0)) {
    return false // Cannot lock empty note
  }
  
  data[date].isLocked = isLocked
  await saveAll(data)
  return true
}

// Legacy functions - kept for backward compatibility
const setNotePassword = async (date, passwordHash, hint = '') => {
  // This now sets master password instead
  return await setMasterPassword(passwordHash, hint)
}

const removeNotePassword = async (date) => {
  // This now just unlocks the specific note
  return await setNoteLocked(date, false)
}

const getAllNotes = async () => {
  const data = await getAll()
  const notes = {}
  Object.keys(data).forEach(key => {
    if (data[key]?.notes) {
      notes[key] = data[key].notes
    }
  })
  return notes
}

// Quotes
const getQuotes = async () => {
  const data = await getAll()
  return data.quotes || []
}

const saveQuotes = async (quotes) => {
  const data = await getAll()
  data.quotes = quotes
  return await saveAll(data)
}

// Countdown - returns {title, targetDate}
const getCountdown = async () => {
  const data = await getAll()
  return data.countdown || { title: '', targetDate: '' }
}

const saveCountdown = async (countdown) => {
  const data = await getAll()
  data.countdown = countdown
  return await saveAll(data)
}

// Goals
const getGoals = async () => {
  const data = await getAll()
  return data.goals || []
}

const saveGoals = async (goals) => {
  const data = await getAll()
  data.goals = goals
  return await saveAll(data)
}

// Study Targets - returns array of targets for a specific date
const getStudyTargets = async (date) => {
  const data = await getAll()
  const dateData = data[date] || {}
  return dateData.studyTargets || []
}

const saveStudyTargets = async (date, targets) => {
  const data = await getAll()
  if (!data[date]) {
    data[date] = {}
  }
  data[date].studyTargets = targets
  return await saveAll(data)
}

// Home Tasks - returns array of tasks for a specific date
const getHomeTasks = async (date) => {
  const data = await getAll()
  const dateData = data[date] || {}
  return dateData.homeTasks || []
}

const saveHomeTasks = async (date, tasks) => {
  const data = await getAll()
  if (!data[date]) {
    data[date] = {}
  }
  data[date].homeTasks = tasks
  return await saveAll(data)
}

// Study Sessions - returns array of study sessions for a specific date
const getStudySessions = async (date) => {
  const data = await getAll()
  const dateData = data[date] || {}
  return dateData.studySessions || []
}

const saveStudySessions = async (date, sessions) => {
  const data = await getAll()
  if (!data[date]) {
    data[date] = {}
  }
  data[date].studySessions = sessions
  return await saveAll(data)
}

// Misfits - returns {subject: {episodeNum: 'completed'|'wrong'|'none'}}
const getMisfitsEpisodes = async () => {
  const data = await getAll()
  return data.misfitsEpisodes || {}
}

const saveMisfitsEpisodes = async (episodes) => {
  const data = await getAll()
  data.misfitsEpisodes = episodes
  return await saveAll(data)
}

// Custom Misfits Subjects
const getCustomMisfitsSubjects = async () => {
  const data = await getAll()
  return data.customMisfitsSubjects || []
}

const saveCustomMisfitsSubjects = async (subjects) => {
  const data = await getAll()
  data.customMisfitsSubjects = subjects
  return await saveAll(data)
}

// PSIR Episodes
const getPSIREpisodes = async () => {
  const data = await getAll()
  return data.psirEpisodes || {}
}

const savePSIREpisodes = async (episodes) => {
  const data = await getAll()
  data.psirEpisodes = episodes
  return await saveAll(data)
}

const getCustomPSIRSeasons = async () => {
  const data = await getAll()
  return data.customPSIRSeasons || []
}

const saveCustomPSIRSeasons = async (seasons) => {
  const data = await getAll()
  data.customPSIRSeasons = seasons
  return await saveAll(data)
}

// PYQ Papers
const getPYQEpisodes = async () => {
  const data = await getAll()
  return data.pyqEpisodes || {}
}

const savePYQEpisodes = async (episodes) => {
  const data = await getAll()
  data.pyqEpisodes = episodes
  return await saveAll(data)
}

const getCustomPYQYears = async () => {
  const data = await getAll()
  return data.customPYQYears || []
}

const saveCustomPYQYears = async (years) => {
  const data = await getAll()
  data.customPYQYears = years
  return await saveAll(data)
}

// Mock Tests
const getMockEpisodes = async () => {
  const data = await getAll()
  return data.mockEpisodes || {}
}

const saveMockEpisodes = async (episodes) => {
  const data = await getAll()
  data.mockEpisodes = episodes
  return await saveAll(data)
}

const getCustomMockTests = async () => {
  const data = await getAll()
  return data.customMockTests || []
}

const saveCustomMockTests = async (tests) => {
  const data = await getAll()
  data.customMockTests = tests
  return await saveAll(data)
}

// Backup/Restore
const exportData = async () => {
  const data = await getAll()
  const jsonString = JSON.stringify(data, null, 2)
  
  if (isElectron()) {
    return await window.electronAPI.exportData()
  }
  
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'daily-tracker-backup.json'
  a.click()
  URL.revokeObjectURL(url)
  return { success: true, data: jsonString }
}

const importData = async (jsonString = null) => {
  if (isElectron() && !jsonString) {
    return await window.electronAPI.importData()
  }
  
  if (jsonString) {
    try {
      const data = JSON.parse(jsonString)
      await saveAll(data)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
  
  // File upload for web
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        try {
          const text = await file.text()
          const data = JSON.parse(text)
          await saveAll(data)
          resolve({ success: true, data })
        } catch (error) {
          resolve({ success: false, error: error.message })
        }
      } else {
        resolve({ success: false })
      }
    }
    input.click()
  })
}

// Clear all data
const clearAll = async () => {
  return await saveAll({})
}

export const storage = {
  // Core operations
  getAll,
  saveAll,
  
  // Date-specific operations
  getDateData,
  saveDateData,
  
  // Habits
  getHabits,
  saveHabits,
  
  // Custom habits
  getCustomHabits,
  saveCustomHabits,
  getAllCustomHabits,
  saveAllCustomHabits,
  
  // Fixed habits list
  getFixedHabitsList,
  saveFixedHabitsList,
  
  // Notes
  getNotes,
  getNotesMetadata,
  saveNotes,
  setNoteLocked,
  setNotePassword,
  removeNotePassword,
  getAllNotes,
  
  // Master password
  getMasterPassword,
  setMasterPassword,
  updateMasterPassword,
  setMasterPasswordRecoveryPattern,
  deleteMasterPassword,
  
  // Quotes
  getQuotes,
  saveQuotes,
  
  // Countdown
  getCountdown,
  saveCountdown,
  
  // Goals
  getGoals,
  saveGoals,
  
  // Study Targets
  getStudyTargets,
  saveStudyTargets,
  
  // Home Tasks
  getHomeTasks,
  saveHomeTasks,

  // Study Sessions
  getStudySessions,
  saveStudySessions,
  
  // Misfits
  getMisfitsEpisodes,
  saveMisfitsEpisodes,
  getCustomMisfitsSubjects,
  saveCustomMisfitsSubjects,
  
  // PSIR
  getPSIREpisodes,
  savePSIREpisodes,
  getCustomPSIRSeasons,
  saveCustomPSIRSeasons,
  
  // PYQ
  getPYQEpisodes,
  savePYQEpisodes,
  getCustomPYQYears,
  saveCustomPYQYears,
  
  // Mock Tests
  getMockEpisodes,
  saveMockEpisodes,
  getCustomMockTests,
  saveCustomMockTests,
  
  // Backup/Restore
  exportData,
  importData,
  clearAll
}

export default storage
