// IndexedDB Storage - Better capacity than localStorage (virtually unlimited)
const DB_NAME = 'DailyTrackerDB'
const DB_VERSION = 1
const STORE_NAME = 'appData'

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
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('IndexedDB getAll error:', error)
    // Fallback to localStorage if IndexedDB fails
    const fallback = localStorage.getItem('dailyTracker_data')
    return fallback ? JSON.parse(fallback) : {}
  }
}

// Save all data to IndexedDB
const saveAll = async (data) => {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put({ id: 'mainData', data, timestamp: Date.now() })
      
      request.onsuccess = () => {
        db.close()
        // Also backup to localStorage as secondary storage
        localStorage.setItem('dailyTracker_data_backup', JSON.stringify(data))
        resolve(true)
      }
      request.onerror = () => {
        db.close()
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('IndexedDB saveAll error:', error)
    // Fallback to localStorage
    localStorage.setItem('dailyTracker_data', JSON.stringify(data))
    return true
  }
}

// Export all functions (same API as fileStorage.js)
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

const getAllCustomHabits = async () => {
  const data = await getAll()
  return data.customHabits || []
}

const saveAllCustomHabits = async (habits) => {
  const data = await getAll()
  data.customHabits = habits
  return await saveAll(data)
}

const getFixedHabitsList = async () => {
  const data = await getAll()
  return data.fixedHabitsList || null
}

const saveFixedHabitsList = async (list) => {
  const data = await getAll()
  data.fixedHabitsList = list
  return await saveAll(data)
}

const getNotes = async (date) => {
  const data = await getAll()
  return data[date]?.notes || ''
}

const saveNotes = async (date, notes) => {
  const data = await getAll()
  if (!data[date]) data[date] = {}
  data[date].notes = notes
  return await saveAll(data)
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

const getQuotes = async () => {
  const data = await getAll()
  return data.quotes || []
}

const saveQuotes = async (quotes) => {
  const data = await getAll()
  data.quotes = quotes
  return await saveAll(data)
}

const getCountdown = async () => {
  const data = await getAll()
  return data.countdown || { title: '', targetDate: '' }
}

const saveCountdown = async (countdown) => {
  const data = await getAll()
  data.countdown = countdown
  return await saveAll(data)
}

const getGoals = async () => {
  const data = await getAll()
  return data.goals || []
}

const saveGoals = async (goals) => {
  const data = await getAll()
  data.goals = goals
  return await saveAll(data)
}

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

const getMisfitsEpisodes = async () => {
  const data = await getAll()
  return data.misfitsEpisodes || {}
}

const saveMisfitsEpisodes = async (episodes) => {
  const data = await getAll()
  data.misfitsEpisodes = episodes
  return await saveAll(data)
}

const getCustomMisfitsSubjects = async () => {
  const data = await getAll()
  return data.customMisfitsSubjects || []
}

const saveCustomMisfitsSubjects = async (subjects) => {
  const data = await getAll()
  data.customMisfitsSubjects = subjects
  return await saveAll(data)
}

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

const exportData = async () => {
  const data = await getAll()
  const jsonString = JSON.stringify(data, null, 2)
  
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
  if (jsonString) {
    try {
      const data = JSON.parse(jsonString)
      await saveAll(data)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
  
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

const clearAll = async () => {
  return await saveAll({})
}

// Migration from localStorage to IndexedDB
const migrateFromLocalStorage = async () => {
  const legacyData = localStorage.getItem('dailyTracker_data')
  if (legacyData) {
    try {
      const parsed = JSON.parse(legacyData)
      await saveAll(parsed)
      console.log('Migrated data from localStorage to IndexedDB')
      // Keep localStorage as backup, don't delete
      return true
    } catch (e) {
      console.error('Migration failed:', e)
      return false
    }
  }
  return false
}

// Run migration on first load
migrateFromLocalStorage().catch(console.error)

export const storage = {
  getAll,
  saveAll,
  getDateData,
  saveDateData,
  getHabits,
  saveHabits,
  getCustomHabits,
  saveCustomHabits,
  getAllCustomHabits,
  saveAllCustomHabits,
  getFixedHabitsList,
  saveFixedHabitsList,
  getNotes,
  saveNotes,
  getAllNotes,
  getQuotes,
  saveQuotes,
  getCountdown,
  saveCountdown,
  getGoals,
  saveGoals,
  getStudyTargets,
  saveStudyTargets,
  getMisfitsEpisodes,
  saveMisfitsEpisodes,
  getCustomMisfitsSubjects,
  saveCustomMisfitsSubjects,
  getPSIREpisodes,
  savePSIREpisodes,
  getCustomPSIRSeasons,
  saveCustomPSIRSeasons,
  exportData,
  importData,
  clearAll,
  migrateFromLocalStorage
}

export default storage
