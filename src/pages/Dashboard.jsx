import { useState, useEffect, useRef } from 'react'
import Header from '../components/Header.jsx'
import MobileBottomNav from '../components/MobileBottomNav.jsx'
import CountdownPanel from '../components/CountdownPanel.jsx'
import HabitTracker from '../components/HabitTracker.jsx'
import WeeklyChart from '../components/WeeklyChart.jsx'
import DailyNotesCalendar from '../components/DailyNotesCalendar.jsx'
import QuotesModal from '../components/QuotesModal.jsx'
import DailyQuote from '../components/DailyQuote.jsx'
import EpisodesTrackerModal from '../components/EpisodesTrackerModal.jsx'
import NoteDetailModal from '../components/NoteDetailModal.jsx'
import DailyStudyTargets from '../components/DailyStudyTargets.jsx'
import DailyHomeTasks from '../components/DailyHomeTasks.jsx'
import RealTimeClock from '../components/RealTimeClock.jsx'
import GoalsTracker from '../components/GoalsTracker.jsx'
import AppLimitsModal from '../components/AppLimitsModal.jsx'
import storage from '../utils/fileStorage.js'
import { formatDate, getToday, calculateStreak, calculateProgress } from '../utils/dateUtils.js'
import { EVENTS, on } from '../utils/events.js'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { handleAppBack, useAppBackHandler } from '../utils/backNavigation.js'

const DEFAULT_FIXED_HABITS = [
  "Practicing Aptitude",
  "Watching Misfits Episodes",
  "Workout",
  "Not watching unwanted content",
  "Waking up early morning",
  "Sleeping early",
  "Having food on time"
]

const DEFAULT_QUOTES = [
  "Discipline beats motivation",
  "Consistency creates success",
  "Small steps every day",
  "Progress over perfection",
  "Stay focused, stay determined"
]

function Dashboard() {
  // Core data state
  const [fixedHabits, setFixedHabits] = useState(DEFAULT_FIXED_HABITS)
  const [quotes, setQuotes] = useState(DEFAULT_QUOTES)
  const [isLoading, setIsLoading] = useState(true)
  
  // Date and progress tracking
  const [selectedDate, setSelectedDate] = useState(getToday())
  const [selectedDateProgress, setSelectedDateProgress] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const lastCalendarDate = useRef(getToday())
  
  // Quote management
  const [quoteChangeTrigger, setQuoteChangeTrigger] = useState(0)
  const [usedQuotes, setUsedQuotes] = useState([])
  
  // Modal states
  const [showQuotesModal, setShowQuotesModal] = useState(false)
  const [showDailyNotesModal, setShowDailyNotesModal] = useState(false)
  const [showMisfitsModal, setShowMisfitsModal] = useState(false)
  const [showGoalsModal, setShowGoalsModal] = useState(false)
  const [showAppLimits, setShowAppLimits] = useState(false)
  const [showNoteDetail, setShowNoteDetail] = useState(null)
  const [selectedNoteDate, setSelectedNoteDate] = useState(null)

  // Initial load sequence
  useEffect(() => {
    const initializeData = async () => {
      try {
        const data = await storage.getAll()
        
        // Initialize fixed habits list
        if (!data.fixedHabitsList) {
          await storage.saveFixedHabitsList(DEFAULT_FIXED_HABITS)
        } else {
          setFixedHabits(data.fixedHabitsList)
        }
        
        // Initialize quotes
        if (!data.quotes || data.quotes.length === 0) {
          await storage.saveQuotes(DEFAULT_QUOTES)
        } else {
          setQuotes(data.quotes)
        }
        
        // Calculate initial progress and streak
        await recalculateMetrics(data)
      } catch (error) {
        console.error('Error initializing data:', error)
        // Use default values if storage fails
        setFixedHabits(DEFAULT_FIXED_HABITS)
        setQuotes(DEFAULT_QUOTES)
      } finally {
        // Always stop loading, even if there was an error
        setIsLoading(false)
      }
    }
    
    // Set a maximum timeout of 5 seconds for loading
    const timeoutId = setTimeout(() => {
      console.warn('Loading timeout reached, forcing load completion')
      setIsLoading(false)
    }, 5000)
    
    initializeData().finally(() => {
      clearTimeout(timeoutId)
    })
  }, [])

  // Listen for habit updates to recalculate metrics and trigger quote change
  useEffect(() => {
    const unsubscribe = on(EVENTS.HABITS_UPDATED, async (payload) => {
      const data = await storage.getAll()
      await recalculateMetrics(data)
      // Trigger quote change on habit update
      setQuoteChangeTrigger(prev => prev + 1)
    })
    
    const unsubStudyTargets = on(EVENTS.STUDY_TARGETS_UPDATED, async (payload) => {
      const data = await storage.getAll()
      await recalculateMetrics(data)
      // Trigger quote change on study target update
      setQuoteChangeTrigger(prev => prev + 1)
    })

    const unsubNotes = on(EVENTS.NOTES_UPDATED, async (payload) => {
      // Trigger quote change on notes update
      setQuoteChangeTrigger(prev => prev + 1)
    })

    const unsubMisfits = on(EVENTS.MISFITS_UPDATED, async (payload) => {
      // Trigger quote change on misfits update
      setQuoteChangeTrigger(prev => prev + 1)
    })

    const unsubCountdown = on(EVENTS.COUNTDOWN_UPDATED, async (payload) => {
      // Trigger quote change on countdown update
      setQuoteChangeTrigger(prev => prev + 1)
    })
    
    return () => {
      unsubscribe()
      unsubStudyTargets()
      unsubNotes()
      unsubMisfits()
      unsubCountdown()
    }
  }, [fixedHabits, selectedDate])

  useEffect(() => {
    const refreshCalendarDate = async () => {
      const today = getToday()
      if (today === lastCalendarDate.current) return

      const previousToday = lastCalendarDate.current
      lastCalendarDate.current = today
      if (selectedDate === previousToday) {
        setSelectedDate(today)
        const data = await storage.getAll()
        await recalculateMetrics(data, today)
      }
    }

    const timer = setInterval(refreshCalendarDate, 30000)
    document.addEventListener('visibilitychange', refreshCalendarDate)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshCalendarDate)
    }
  }, [fixedHabits, selectedDate])

  // Recalculate progress and streak
  const recalculateMetrics = async (data, date = selectedDate) => {
    const selectedDayData = data[date] || {}
    const habits = selectedDayData.habits || {}
    const customHabits = selectedDayData.customHabits || []

    const progress = calculateProgress(habits, customHabits)
    setSelectedDateProgress(progress)

    const streak = calculateStreak(data, fixedHabits)
    setCurrentStreak(streak)
  }

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      await storage.clearAll()
      window.location.reload()
    }
  }

  const handleExport = async () => {
    try {
      const data = await storage.getAll()
      const dataStr = JSON.stringify(data, null, 2)
      const fileName = `daily-tracker-backup-${new Date().toISOString().split('T')[0]}.json`

      if (Capacitor.isNativePlatform()) {
        const filePath = `backups/${fileName}`
        await Filesystem.writeFile({
          path: filePath,
          data: dataStr,
          directory: Directory.Cache,
          encoding: 'utf8',
          recursive: true
        })
        const { uri } = await Filesystem.getUri({
          path: filePath,
          directory: Directory.Cache
        })
        await Share.share({
          title: 'Daily Tracker Backup',
          text: 'Save this JSON backup file so you can import your data on another device.',
          files: [uri],
          dialogTitle: 'Save backup file'
        })
        alert('Backup shared. Choose a destination such as Files or Drive to keep it for later.')
      } else {
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        alert('Data exported successfully! Save this file to import later.')
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.setAttribute('aria-label', 'Choose Daily Tracker backup file')
    input.style.position = 'fixed'
    input.style.left = '-10000px'
    document.body.appendChild(input)

    input.onchange = async () => {
      const file = input.files?.[0]
      input.remove()
      if (!file) return
      
      try {
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = () => reject(reader.error || new Error('Unable to read the selected backup file.'))
          reader.readAsText(file)
        })
        const data = JSON.parse(text)
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error('The selected file is not a Daily Tracker backup.')
        }
        
        if (confirm('This will replace all current data with the imported data. Are you sure?')) {
          await storage.saveAll(data)
          alert('Data imported successfully! Page will reload.')
          window.location.reload()
        }
      } catch (error) {
        console.error('Import failed:', error)
        alert(`Import failed: ${error.message || 'Please check the backup file.'}`)
      }
    }

    input.oncancel = () => input.remove()
    input.click()
  }

  const handleDailyNotesClick = () => {
    setShowDailyNotesModal(true)
  }

  const handleDayClick = (date) => {
    setSelectedNoteDate(date)
    setShowNoteDetail(true)
    // Don't close calendar, keep it open in background
  }

  const handleNoteDetailClose = () => {
    setShowNoteDetail(false)
    setSelectedNoteDate(null)
    // Keep calendar open
  }

  const handleDashboardBack = () => {
    if (showAppLimits) setShowAppLimits(false)
    else if (showNoteDetail) handleNoteDetailClose()
    else if (showDailyNotesModal) setShowDailyNotesModal(false)
    else if (showQuotesModal) setShowQuotesModal(false)
    else if (showMisfitsModal) setShowMisfitsModal(false)
    else if (showGoalsModal) setShowGoalsModal(false)
    else return false
    return true
  }
  useAppBackHandler(handleDashboardBack, true, 1)

  useEffect(() => {
    let backButtonListener
    let isMounted = true
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && handleAppBack()) event.preventDefault()
    }

    window.addEventListener('keydown', handleKeyDown)
    if (Capacitor.isNativePlatform()) {
      App.addListener('backButton', ({ canGoBack }) => {
        if (handleAppBack()) return
        if (canGoBack) window.history.back()
        else App.exitApp()
      }).then(listener => {
        if (isMounted) backButtonListener = listener
        else listener.remove()
      }).catch(error => {
        console.error('Could not register Android back-button handling:', error)
      })
    }

    return () => {
      isMounted = false
      window.removeEventListener('keydown', handleKeyDown)
      backButtonListener?.remove()
    }
  }, [])

  const handleViewingDateChange = async (date) => {
    setSelectedDate(date)
    const data = await storage.getAll()
    await recalculateMetrics(data, date)
  }

  const handleQuotesChange = (newQuotes) => {
    setQuotes(newQuotes)
    setQuoteChangeTrigger(prev => prev + 1)
    setUsedQuotes([]) // Reset used quotes when list changes
  }

  const handleMoveToDayFromCalendar = (date) => {
    handleViewingDateChange(date)
    setShowDailyNotesModal(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600">Loading...</div>
      </div>
    )
  }

  const isFeatureOpen = showQuotesModal || showDailyNotesModal || showMisfitsModal || showGoalsModal || showAppLimits || showNoteDetail

  return (
    <div className="min-h-screen p-2 sm:p-3 md:p-4 pb-20 sm:pb-8 safe-area-bottom">
      <div className="container mx-auto px-2 sm:px-3 md:px-4 max-w-6xl">
        {/* Header with 5 Action Buttons */}
        <Header 
          onQuotesClick={() => setShowQuotesModal(true)}
          onDailyNotesClick={handleDailyNotesClick}
          onMisfitsClick={() => setShowMisfitsModal(true)}
          onGoalsClick={() => setShowGoalsModal(true)}
          onResetClick={handleReset}
          onExportClick={handleExport}
          onImportClick={handleImport}
          selectedDate={selectedDate}
          streak={currentStreak}
        />

        {/* Daily Quote Card */}
        <div className="max-w-4xl mx-auto mb-2 sm:mb-4">
          <DailyQuote 
            quotes={quotes} 
            changeTrigger={quoteChangeTrigger}
            usedQuotes={usedQuotes}
            setUsedQuotes={setUsedQuotes}
          />
        </div>

        {/* Viewing Date Badge with Progress */}
        <div className="text-center mb-3 sm:mb-6 space-y-1 sm:space-y-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/50 backdrop-blur-sm rounded-full border border-white/30 shadow-sm text-xs sm:text-sm font-medium text-gray-700">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {selectedDate}
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs sm:text-sm text-gray-600">
              {selectedDate === getToday() ? "Today's Progress:" : "Selected Day's Progress:"}
            </span>
            <span className="text-xs sm:text-sm font-bold text-blue-600">{Math.round(selectedDateProgress)}%</span>
          </div>
        </div>

        {/* Grid Layout for Main Cards - Mobile-first single column */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {/* Row 1: Countdown + Habits + RealTime Clock */}
          <div className="h-full">
            <CountdownPanel />
          </div>
          <div className="h-full md:col-span-1 lg:col-span-1">
            <HabitTracker 
              fixedHabits={fixedHabits} 
              selectedDate={selectedDate}
              onDateChange={handleViewingDateChange}
              onFixedHabitsChange={setFixedHabits}
            />
          </div>
          <div className="h-full hidden md:block lg:block">
            <RealTimeClock selectedDate={selectedDate} />
          </div>

          {/* Row 2: Study Targets */}
          <div className="h-full col-span-1 md:col-span-2 lg:col-span-3">
            <DailyStudyTargets selectedDate={selectedDate} />
          </div>

          {/* Row 3: Home Tasks */}
          <div id="home-tasks-section" className="h-full col-span-1 md:col-span-2 lg:col-span-3">
            <DailyHomeTasks selectedDate={selectedDate} />
          </div>

          {/* Mobile-only RealTimeClock */}
          <div className="h-full col-span-1 md:hidden">
            <RealTimeClock selectedDate={selectedDate} />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {!isFeatureOpen && <MobileBottomNav
        onQuotesClick={() => setShowQuotesModal(true)}
        onDailyNotesClick={handleDailyNotesClick}
        onMisfitsClick={() => setShowMisfitsModal(true)}
        onGoalsClick={() => setShowGoalsModal(true)}
        onResetClick={handleReset}
        onExportClick={handleExport}
        onImportClick={handleImport}
        onAppLimitsClick={Capacitor.getPlatform() === 'android' ? () => setShowAppLimits(true) : undefined}
        streak={currentStreak}
      />}

      {/* Modals */}
      {showQuotesModal && (
        <QuotesModal 
          quotes={quotes}
          onClose={() => setShowQuotesModal(false)}
          onQuotesChange={handleQuotesChange}
        />
      )}

      {showMisfitsModal && (
        <EpisodesTrackerModal 
          onClose={() => setShowMisfitsModal(false)}
        />
      )}

      {showDailyNotesModal && (
        <DailyNotesCalendar 
          fixedHabits={fixedHabits}
          selectedDate={selectedDate}
          onClose={() => setShowDailyNotesModal(false)}
          onDayClick={handleDayClick}
          onMoveToDay={handleMoveToDayFromCalendar}
        />
      )}

      {showGoalsModal && (
        <GoalsTracker 
          onClose={() => setShowGoalsModal(false)}
        />
      )}

      {showAppLimits && (
        <AppLimitsModal onClose={() => setShowAppLimits(false)} />
      )}

      {showNoteDetail && selectedNoteDate && (
        <NoteDetailModal 
          date={selectedNoteDate}
          onClose={handleNoteDetailClose}
        />
      )}
    </div>
  )
}

export default Dashboard
