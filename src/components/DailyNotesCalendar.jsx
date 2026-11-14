import { useState, useEffect } from 'react'
import storage from '../utils/fileStorage.js'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays,
  subMonths,
  addMonths,
  isSameMonth,
  isSameDay
} from 'date-fns'
import { formatDate } from '../utils/dateUtils.js'
import { emit, on, NOTES_UPDATED, EVENTS } from '../utils/events.js'
import DayActionModal from './DayActionModal.jsx'
import ChangePasswordModal from './ChangePasswordModal.jsx'
import DeletePasswordModal from './DeletePasswordModal.jsx'
import { verifyPassword, hashPassword } from '../utils/passwordUtils.js'
import RecoveryPatternModal from './RecoveryPatternModal.jsx'
import { useAppBackHandler } from '../utils/backNavigation.js'

function DailyNotesCalendar({ fixedHabits, selectedDate, onClose, onDayClick, onMoveToDay }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(`${selectedDate}T00:00:00`))
  const [calendarDays, setCalendarDays] = useState([])
  const [notesData, setNotesData] = useState({})
  const [habitsData, setHabitsData] = useState({})
  const [studyTargetsData, setStudyTargetsData] = useState({})
  const [lockedNotes, setLockedNotes] = useState({})
  const [viewMode, setViewMode] = useState('habits')
  const [showDayActionModal, setShowDayActionModal] = useState(false)
  const [selectedDayForAction, setSelectedDayForAction] = useState(null)
  
  // Master password state
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showDeletePassword, setShowDeletePassword] = useState(false)
  const [showRecoveryPattern, setShowRecoveryPattern] = useState(false)
  const [masterPasswordHash, setMasterPasswordHash] = useState('')
  const [masterPasswordHint, setMasterPasswordHint] = useState('')
  const [recoveryPatternHash, setRecoveryPatternHash] = useState('')

  const handleBack = () => {
    if (showDeletePassword) setShowDeletePassword(false)
    else if (showRecoveryPattern) setShowRecoveryPattern(false)
    else if (showChangePassword) setShowChangePassword(false)
    else if (showDayActionModal) {
      setShowDayActionModal(false)
      setSelectedDayForAction(null)
    } else onClose()
    return true
  }
  useAppBackHandler(handleBack, true, 10)

  useEffect(() => {
    loadCalendarData()
    loadMasterPassword()
    
    const unsubscribeNotes = on(NOTES_UPDATED, () => {
      loadCalendarData()
    })

    const unsubscribeHabits = on(EVENTS.HABITS_UPDATED, () => {
      loadCalendarData()
    })
    const unsubscribeStudyTargets = on(EVENTS.STUDY_TARGETS_UPDATED, () => {
      loadCalendarData()
    })
    const unsubscribeMasterPassword = on(EVENTS.MASTER_PASSWORD_UPDATED, loadMasterPassword)
    
    // Listen for undo/redo state restoration
    const handleStateRestored = () => {
      loadCalendarData()
      loadMasterPassword()
    }
    window.addEventListener('state-restored', handleStateRestored)
    
    return () => {
      unsubscribeNotes()
      unsubscribeHabits()
      unsubscribeStudyTargets()
      unsubscribeMasterPassword()
      window.removeEventListener('state-restored', handleStateRestored)
    }
  }, [currentMonth])
  
  const loadMasterPassword = async () => {
    const masterPassword = await storage.getMasterPassword()
    setMasterPasswordHash(masterPassword.hash)
    setMasterPasswordHint(masterPassword.hint)
    setRecoveryPatternHash(masterPassword.recoveryPatternHash)
  }

  const loadCalendarData = async () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    
    const days = []
    let day = calendarStart
    
    while (day <= calendarEnd) {
      days.push(day)
      day = addDays(day, 1)
    }
    
    setCalendarDays(days)
    
    const allData = await storage.getAll()
    const allNotes = {}
    const allHabits = {}
    const allStudyTargets = {}
    
    days.forEach(day => {
      const key = formatDate(day)
      if (allData[key]) {
        // Extract notes (check both 'notes' and 'note' for backward compatibility)
        if (allData[key].notes || allData[key].note || typeof allData[key] === 'string') {
          allNotes[key] = allData[key].notes || allData[key].note || allData[key]
        }
        // Extract habits data
        if (allData[key].habits || allData[key].customHabits) {
          allHabits[key] = {
            habits: allData[key].habits || {},
            customHabits: allData[key].customHabits || []
          }
        }
        if (allData[key].studyTargets) {
          allStudyTargets[key] = allData[key].studyTargets
        }
      }
    })
    
    setNotesData(allNotes)
    setHabitsData(allHabits)
    setStudyTargetsData(allStudyTargets)
    
    // Load lock status for notes (only for notes with content)
    const allLockedNotes = {}
    days.forEach(day => {
      const key = formatDate(day)
      const noteContent = allData[key]?.notes || ''
      if (allData[key]?.isLocked && noteContent && noteContent.trim().length > 0) {
        allLockedNotes[key] = true
      }
    })
    setLockedNotes(allLockedNotes)
  }

  const hasNote = (date) => {
    const dateKey = formatDate(date)
    const note = notesData[dateKey]
    return note && note.trim && note.trim().length > 0
  }

  const isNoteLocked = (date) => {
    const dateKey = formatDate(date)
    const noteContent = notesData[dateKey]
    return lockedNotes[dateKey] && noteContent && noteContent.trim().length > 0
  }

  const getDayHabitStats = (date) => {
    const dateKey = formatDate(date)
    const dayData = habitsData[dateKey]
    
    if (!dayData) return { completed: 0, total: 0, percentage: 0 }
    
    const habits = dayData.habits || {}
    const customHabits = dayData.customHabits || []
    
    const fixedCompleted = Object.values(habits).filter(Boolean).length
    const customCompleted = customHabits.filter(h => h.status === 'completed').length
    const completedHabits = fixedCompleted + customCompleted
    const totalHabits = Object.keys(habits).length + customHabits.length
    
    return {
      completed: completedHabits,
      total: totalHabits,
      percentage: totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0
    }
  }

  const getDayStudyTargetStats = (date) => {
    const targets = studyTargetsData[formatDate(date)] || []
    const completed = targets.filter(target => target.completed).length
    return {
      completed,
      total: targets.length,
      percentage: targets.length ? Math.round((completed / targets.length) * 100) : 0
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1))
  }

  const handleDayClick = (day) => {
    setSelectedDayForAction(formatDate(day))
    setShowDayActionModal(true)
  }

  const handleMoveToDay = (date) => {
    if (onMoveToDay) {
      onMoveToDay(date)
    }
  }

  const handleOpenNotes = (date) => {
    if (onDayClick) {
      onDayClick(date)
    }
  }

  const handleNoteClick = (dateKey) => {
    onDayClick(dateKey)
  }
  
  const handleChangePassword = async (oldPassword, newPassword, newHint) => {
    const isOldPasswordValid = await verifyPassword(oldPassword, masterPasswordHash)
    if (!isOldPasswordValid) {
      return { success: false, error: 'Old password is incorrect' }
    }
    
    const newPasswordHash = await hashPassword(newPassword)
    await storage.updateMasterPassword(newPasswordHash, newHint)
    setMasterPasswordHash(newPasswordHash)
    setMasterPasswordHint(newHint)
    emit(EVENTS.MASTER_PASSWORD_UPDATED)
    return { success: true }
  }

  const handleSaveRecoveryPattern = async (patternHash) => {
    await storage.setMasterPasswordRecoveryPattern(patternHash)
    setRecoveryPatternHash(patternHash)
    emit(EVENTS.MASTER_PASSWORD_UPDATED)
  }

  const handlePatternSubmit = async (pattern) => {
    const isValid = await verifyPassword(pattern.join(','), recoveryPatternHash)
    return isValid
      ? { success: true }
      : { success: false, error: 'The recovery pattern is incorrect' }
  }

  const handleRecoverPassword = async (newPassword) => {
    try {
      const newPasswordHash = await hashPassword(newPassword)
      await storage.updateMasterPassword(newPasswordHash, masterPasswordHint)
      setMasterPasswordHash(newPasswordHash)
      emit(EVENTS.MASTER_PASSWORD_UPDATED)
      return { success: true }
    } catch (error) {
      console.error('Could not reset the master password:', error)
      return { success: false, error: 'Could not reset the master password. Please try again.' }
    }
  }
  
  const handleDeletePassword = async (currentPassword) => {
    if (currentPassword) {
      const isValid = await verifyPassword(currentPassword, masterPasswordHash)
      if (!isValid) {
        return { success: false, error: 'Incorrect password' }
      }
    }
    
    await storage.deleteMasterPassword()
    setMasterPasswordHash('')
    setMasterPasswordHint('')
    setRecoveryPatternHash('')
    setLockedNotes({})
    emit(EVENTS.MASTER_PASSWORD_UPDATED)
    return { success: true }
  }

  const getNotesList = () => {
    const notes = []
    Object.entries(notesData).forEach(([dateKey, note]) => {
      if (note && note.trim().length > 0) {
        const isLocked = lockedNotes[dateKey] && note.trim().length > 0
        notes.push({
          date: dateKey,
          preview: isLocked ? '🔒 This note is locked - enter password to view' : (note.length > 60 ? note.substring(0, 60) + '...' : note),
          fullNote: note,
          isLocked: isLocked
        })
      }
    })
    // Sort by date descending (newest first)
    return notes.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-2 animate-fade-in safe-area-top safe-area-bottom"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-none sm:rounded-xl shadow-2xl w-full h-dvh md:h-auto md:max-h-[90vh] md:max-w-6xl modal-enter border border-blue-200 flex flex-col sm:my-2 md:my-8">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b bg-gradient-to-r from-blue-500 to-indigo-500 sm:rounded-t-xl flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Calendar
          </h2>
          <div className="flex items-center gap-3">
            {/* Master password settings button */}
            {masterPasswordHash && (
              <>
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="text-white/80 hover:text-white p-2 sm:p-3 rounded-lg hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px]"
                  title="Change master password"
                  aria-label="Change master password"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowRecoveryPattern(true)}
                  className="rounded-lg px-2 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 sm:px-3 sm:text-sm"
                  title={recoveryPatternHash ? 'Change recovery pattern' : 'Set recovery pattern'}
                >
                  {recoveryPatternHash ? 'Recovery' : 'Set recovery'}
                </button>
              </>
            )}
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white text-3xl font-bold flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* View Toggle - Always Visible */}
          <div className="flex gap-2 mb-6 flex-wrap md:flex-nowrap">
            {[
              { id: 'habits', label: 'Habit Tracker' },
              { id: 'studyTargets', label: 'Study Targets' },
              { id: 'notes', label: `Notes (${getNotesList().length})` }
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setViewMode(view.id)}
                className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg font-medium transition-all text-sm md:text-base ${
                  viewMode === view.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>

          {viewMode !== 'notes' ? (
            <>
              {/* Month Navigation */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <button 
                  onClick={handlePrevMonth} 
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-lg font-semibold text-slate-800 min-w-[150px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button 
                  onClick={handleNextMonth} 
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid with Notes + Habits - MOBILE OPTIMIZED */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {calendarDays.map((day, index) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isToday = isSameDay(day, new Date())
                  const isSelectedDate = formatDate(day) === selectedDate
                  const dayHasNote = hasNote(day)
                  const dayIsLocked = isNoteLocked(day)
                  const habitStats = getDayHabitStats(day)
                  const targetStats = getDayStudyTargetStats(day)
                  const progressStats = viewMode === 'habits' ? habitStats : targetStats
                  const progressName = viewMode === 'habits' ? 'habits' : 'study targets'
                  const borderClass = isSelectedDate
                    ? 'border-violet-600'
                    : isToday
                      ? 'border-blue-500'
                      : progressStats.total > 0
                        ? 'border-emerald-400'
                        : dayHasNote
                          ? 'border-emerald-400'
                        : isCurrentMonth
                          ? 'border-blue-200'
                          : 'border-slate-200'
                  const highlightClass = isToday
                    ? 'ring-2 ring-blue-500 ring-offset-1 shadow-md'
                    : isSelectedDate
                      ? 'ring-2 ring-violet-500 ring-offset-1 shadow-md'
                      : ''
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleDayClick(day)}
                      className={`
                        min-h-[70px] sm:min-h-[85px] rounded-lg border-2 flex flex-col items-center justify-between p-1.5 sm:p-2
                        transition-all hover:scale-105 relative overflow-hidden
                        ${isCurrentMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 text-slate-400'}
                        ${borderClass} ${highlightClass}
                      `}
                      title={`${format(day, 'MMM d')}${isToday ? ' • Today' : ''}${isSelectedDate ? ' • Viewing date' : ''}: ${progressStats.completed}/${progressStats.total} ${progressName}${dayHasNote ? ' • Has note' : ''}`}
                      aria-label={`${format(day, 'MMMM d, yyyy')}${isToday ? ', today' : ''}${isSelectedDate ? ', selected date' : ''}`}
                    >
                      {progressStats.total > 0 && (
                        <div
                          className={`absolute bottom-0 left-0 right-0 transition-all ${
                            progressStats.percentage >= 50 ? 'bg-blue-500' : 'bg-slate-400'
                          }`}
                          style={{ height: `${progressStats.percentage}%`, opacity: 0.3 }}
                        ></div>
                      )}

                      {/* Top: Date number - Larger and clearer */}
                      <div className="flex items-center justify-between w-full relative z-10">
                        <span className="text-sm sm:text-base font-bold text-slate-800">
                          {format(day, 'd')}
                        </span>
                        {/* Note indicator - Prominent icon */}
                        {dayHasNote && (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${dayIsLocked ? 'bg-red-500' : 'bg-emerald-500'}`}>
                            {dayIsLocked ? (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-0.5 mt-auto relative z-10">
                        {progressStats.total > 0 && (
                          <>
                            <span className="text-[10px] sm:text-xs font-semibold text-slate-800">
                              {progressStats.completed}/{progressStats.total}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-medium text-slate-600">
                              {progressStats.percentage}%
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Legend - Improved for mobile */}
              <div className="flex flex-wrap justify-center gap-3 text-xs sm:text-sm mt-6 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded border-2 border-blue-500 ring-1 ring-blue-500"></div>
                  <span className="text-slate-600">Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded border-2 border-violet-600 ring-1 ring-violet-500"></div>
                  <span className="text-slate-600">Viewing date</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-600">Note</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-slate-600">Locked Note</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-blue-500 rounded opacity-30"></div>
                  <span className="text-slate-600">&gt;50% Complete</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-slate-400 rounded opacity-30"></div>
                  <span className="text-slate-600">&lt;50% Complete</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="px-1.5 py-0.5 border-2 border-blue-500 rounded text-blue-600 font-semibold text-[10px]">
                    Today
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* List View */
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {getNotesList().length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-2xl mb-2">📝</p>
                  <p className="text-lg font-medium">No notes yet</p>
                  <p className="text-sm mt-1">Open the calendar and choose a day to add your first note.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getNotesList().map((noteItem) => (
                    <button
                      key={noteItem.date}
                      onClick={() => handleNoteClick(noteItem.date)}
                      className="w-full text-left p-3 bg-gradient-to-r from-slate-50 to-white hover:from-blue-50 hover:to-blue-50 rounded-lg transition-all border border-slate-200 hover:border-blue-300 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                            {noteItem.date}
                          </span>
                          {noteItem.isLocked && (
                            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-700 mt-2 line-clamp-2">
                        {noteItem.preview}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 md:p-6 border-t bg-gradient-to-r from-blue-50 to-indigo-50 rounded-b-xl flex justify-center">
          <button 
            onClick={onClose}
            className="px-8 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg"
          >
            Done
          </button>
        </div>

        {/* Day Action Modal */}
        {showDayActionModal && selectedDayForAction && (
          <DayActionModal
            date={selectedDayForAction}
            onClose={() => {
              setShowDayActionModal(false)
              setSelectedDayForAction(null)
            }}
            onMoveToDay={handleMoveToDay}
            onOpenNotes={handleOpenNotes}
          />
        )}
        
        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={showChangePassword}
          onClose={() => setShowChangePassword(false)}
          onChangePassword={handleChangePassword}
          currentHint={masterPasswordHint}
          onDeletePassword={() => setShowDeletePassword(true)}
          recoveryPatternHash={recoveryPatternHash}
          onPatternSubmit={handlePatternSubmit}
          onRecoverPassword={handleRecoverPassword}
        />
        
        {/* Delete Password Modal */}
        <DeletePasswordModal
          isOpen={showDeletePassword}
          onClose={() => setShowDeletePassword(false)}
          onDeletePassword={handleDeletePassword}
          requirePassword={true}
        />
        <RecoveryPatternModal
          isOpen={showRecoveryPattern}
          onClose={() => setShowRecoveryPattern(false)}
          masterPasswordHash={masterPasswordHash}
          onSave={handleSaveRecoveryPattern}
        />
      </div>
    </div>
  )
}

export default DailyNotesCalendar
