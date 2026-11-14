import { useState, useEffect } from 'react'
import storage from '../utils/fileStorage.js'
import { formatDate, formatDisplayDate, calculateProgress } from '../utils/dateUtils.js'
import { emit, EVENTS } from '../utils/events.js'
import ProgressBar from './ProgressBar.jsx'

function HabitTracker({ fixedHabits, selectedDate, onDateChange, onFixedHabitsChange }) {
  // habitsStatus is object {habitName: boolean}
  const [habitsStatus, setHabitsStatus] = useState({})
  const [customHabits, setCustomHabits] = useState([])
  const [newHabitText, setNewHabitText] = useState('')
  const [editingHabit, setEditingHabit] = useState(null)
  const [editText, setEditText] = useState('')
  
  // Fixed habits management
  const [newFixedHabitText, setNewFixedHabitText] = useState('')
  const [editingFixedHabit, setEditingFixedHabit] = useState(null)
  const [editFixedText, setEditFixedText] = useState('')
  const [showFixedHabitManager, setShowFixedHabitManager] = useState(false)

  useEffect(() => {
    loadHabitsForDate(selectedDate)
  }, [selectedDate])

  const loadHabitsForDate = async (date) => {
    const savedHabits = await storage.getHabits(date)
    const savedCustomHabits = await storage.getCustomHabits(date)
    
    // Initialize habits object from saved data or create new with fixed habits
    if (savedHabits && Object.keys(savedHabits).length > 0) {
      setHabitsStatus(savedHabits)
    } else {
      // Create initial habits object with all fixed habits set to false
      const initialHabits = {}
      fixedHabits.forEach(name => {
        initialHabits[name] = false
      })
      setHabitsStatus(initialHabits)
    }
    
    setCustomHabits(savedCustomHabits || [])
  }

  const handleToggleHabit = async (habitName) => {
    const updated = { ...habitsStatus, [habitName]: !habitsStatus[habitName] }
    setHabitsStatus(updated)
    await storage.saveHabits(selectedDate, updated)
    emit(EVENTS.HABITS_UPDATED, { date: selectedDate, habits: updated, customHabits })
  }

  const handleAddCustomHabit = async () => {
    if (!newHabitText.trim()) return
    
    const updated = [...customHabits, { text: newHabitText.trim(), status: 'none' }]
    setCustomHabits(updated)
    await storage.saveCustomHabits(selectedDate, updated)
    setNewHabitText('')
    emit(EVENTS.HABITS_UPDATED, { date: selectedDate, habits: habitsStatus, customHabits: updated })
  }

  // 3-state toggle for custom habits: none → completed → wrong → none
  const handleToggleCustomHabit = async (index) => {
    const currentHabit = customHabits[index]
    let newStatus
    
    if (!currentHabit.status || currentHabit.status === 'none') {
      newStatus = 'completed'
    } else if (currentHabit.status === 'completed') {
      newStatus = 'wrong'
    } else {
      newStatus = 'none'
    }
    
    const updated = customHabits.map((h, i) => 
      i === index ? { ...h, status: newStatus } : h
    )
    setCustomHabits(updated)
    await storage.saveCustomHabits(selectedDate, updated)
    emit(EVENTS.HABITS_UPDATED, { date: selectedDate, habits: habitsStatus, customHabits: updated })
  }

  const handleRemoveCustomHabit = async (index) => {
    const updated = customHabits.filter((_, i) => i !== index)
    setCustomHabits(updated)
    await storage.saveCustomHabits(selectedDate, updated)
    emit(EVENTS.HABITS_UPDATED, { date: selectedDate, habits: habitsStatus, customHabits: updated })
  }

  const handleStartEdit = (index) => {
    setEditingHabit(index)
    setEditText(customHabits[index].text)
  }

  const handleSaveEdit = async () => {
    if (!editText.trim()) return
    
    const updated = customHabits.map((h, i) => 
      i === editingHabit ? { ...h, text: editText.trim() } : h
    )
    setCustomHabits(updated)
    await storage.saveCustomHabits(selectedDate, updated)
    emit(EVENTS.HABITS_UPDATED, { date: selectedDate, habits: habitsStatus, customHabits: updated })
    
    setEditingHabit(null)
    setEditText('')
  }

  // Fixed habit management handlers
  const handleAddFixedHabit = async () => {
    if (!newFixedHabitText.trim()) return
    const habitName = newFixedHabitText.trim()
    
    // Update fixed habits list
    const updatedFixedHabits = [...fixedHabits, habitName]
    await storage.saveFixedHabitsList(updatedFixedHabits)
    
    // Add to current habits status
    const updatedHabitsStatus = { ...habitsStatus, [habitName]: false }
    setHabitsStatus(updatedHabitsStatus)
    await storage.saveHabits(selectedDate, updatedHabitsStatus)
    
    setNewFixedHabitText('')
    
    // Notify parent
    if (onFixedHabitsChange) {
      onFixedHabitsChange(updatedFixedHabits)
    }
    emit(EVENTS.HABITS_UPDATED, { date: selectedDate, habits: updatedHabitsStatus, customHabits })
  }

  const handleStartEditFixedHabit = (habitName) => {
    setEditingFixedHabit(habitName)
    setEditFixedText(habitName)
  }

  const handleSaveFixedHabitEdit = async () => {
    if (!editFixedText.trim() || editFixedText.trim() === editingFixedHabit) {
      setEditingFixedHabit(null)
      return
    }
    
    const oldName = editingFixedHabit
    const newName = editFixedText.trim()
    
    // Update fixed habits list
    const updatedFixedHabits = fixedHabits.map(h => h === oldName ? newName : h)
    await storage.saveFixedHabitsList(updatedFixedHabits)
    
    // Update habits status with new key
    const { [oldName]: oldValue, ...rest } = habitsStatus
    const updatedHabitsStatus = { ...rest, [newName]: oldValue || false }
    setHabitsStatus(updatedHabitsStatus)
    await storage.saveHabits(selectedDate, updatedHabitsStatus)
    
    setEditingFixedHabit(null)
    setEditFixedText('')
    
    // Notify parent
    if (onFixedHabitsChange) {
      onFixedHabitsChange(updatedFixedHabits)
    }
    emit(EVENTS.HABITS_UPDATED, { date: selectedDate, habits: updatedHabitsStatus, customHabits })
  }

  const handleRemoveFixedHabit = async (habitName) => {
    if (!confirm(`Delete "${habitName}"?`)) return
    
    // Update fixed habits list
    const updatedFixedHabits = fixedHabits.filter(h => h !== habitName)
    await storage.saveFixedHabitsList(updatedFixedHabits)
    
    // Remove from habits status
    const { [habitName]: _, ...rest } = habitsStatus
    const updatedHabitsStatus = { ...rest }
    setHabitsStatus(updatedHabitsStatus)
    await storage.saveHabits(selectedDate, updatedHabitsStatus)
    
    // Notify parent
    if (onFixedHabitsChange) {
      onFixedHabitsChange(updatedFixedHabits)
    }
    emit(EVENTS.HABITS_UPDATED, { date: selectedDate, habits: updatedHabitsStatus, customHabits })
  }

  // Calculate progress - only count 'completed' status for custom habits
  const fixedCompleted = Object.values(habitsStatus).filter(Boolean).length
  const customCompleted = customHabits.filter(h => h.status === 'completed').length
  const completedCount = fixedCompleted + customCompleted
  const totalCount = Object.keys(habitsStatus).length + customHabits.length
  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="bg-white border-2 border-blue-200 rounded-2xl p-3 sm:p-6 h-full flex flex-col shadow-xl hover:shadow-2xl transition-all">
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="text-xl sm:text-2xl">✅</span>
          Habit Tracker
        </h2>
      </div>

      <p className="text-xs sm:text-sm text-slate-600 mb-2 sm:mb-3 font-medium">{formatDisplayDate(new Date(selectedDate))}</p>

      {/* Progress Bar - Enhanced */}
      <div className="mb-3 sm:mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-3 sm:p-4 border-2 border-blue-200 shadow-inner">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-700">Progress for this day</h3>
          <span className="text-xs sm:text-sm font-bold text-blue-600">{completedCount}/{totalCount}</span>
        </div>
        <div className="w-full h-2 sm:h-3 bg-white rounded-full overflow-hidden border-2 border-blue-200 shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700 shadow-lg"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="text-right mt-1 sm:mt-2">
          <span className="text-xs font-bold text-blue-600">{percentage}% Complete</span>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto scrollbar-thin space-y-2 sm:space-y-3 max-h-[40vh] sm:max-h-none">
        {/* Fixed Habits */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-medium text-slate-600">Fixed Habits</h3>
            <button
              onClick={() => setShowFixedHabitManager(!showFixedHabitManager)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showFixedHabitManager ? 'Done' : 'Manage'}
            </button>
          </div>

          {/* Add Fixed Habit */}
          {showFixedHabitManager && (
            <div className="flex gap-2 p-2 sm:p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-md">
              <input
                type="text"
                placeholder="Add fixed habit..."
                value={newFixedHabitText}
                onChange={(e) => setNewFixedHabitText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddFixedHabit()}
                className="flex-1 px-2 sm:px-3 py-2 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              />
              <button onClick={handleAddFixedHabit} className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl text-xs sm:text-sm">
                Add
              </button>
            </div>
          )}

          {Object.entries(habitsStatus).map(([habitName, completed]) => (
            <div
              key={habitName}
              className={`group flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${
                completed
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-white border-blue-200 hover:border-blue-400'
              }`}
            >
              <button
                onClick={() => handleToggleHabit(habitName)}
                className={`flex-shrink-0 w-8 h-8 sm:w-6 sm:h-6 rounded-xl border-2 flex items-center justify-center transition-all active:scale-95 shadow-sm ${
                  completed
                    ? 'bg-emerald-500 border-emerald-500 shadow-md'
                    : 'border-blue-400 hover:border-blue-500 hover:bg-blue-50'
                }`}
              >
                {completed && (
                  <svg className="w-5 h-5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {editingFixedHabit === habitName ? (
                <>
                  <input
                    type="text"
                    value={editFixedText}
                    onChange={(e) => setEditFixedText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveFixedHabitEdit()}
                    className="flex-1 px-2 py-1 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    autoFocus
                  />
                  <button onClick={handleSaveFixedHabitEdit} className="p-2 sm:p-1.5 hover:bg-blue-100 rounded-xl text-blue-600 transition-colors active:scale-95">
                    <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button onClick={() => setEditingFixedHabit(null)} className="p-2 sm:p-1.5 hover:bg-red-100 rounded-xl text-red-600 transition-colors active:scale-95">
                    <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <span className={`flex-1 text-xs sm:text-sm font-medium ${
                    completed
                      ? 'text-slate-500 line-through'
                      : 'text-slate-700'
                  }`}>
                    {habitName}
                  </span>
                  {showFixedHabitManager && (
                    <div className="flex gap-1 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEditFixedHabit(habitName)}
                        className="p-2 sm:p-1.5 hover:bg-blue-100 rounded-xl text-blue-600 transition-colors active:scale-95"
                      >
                        <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemoveFixedHabit(habitName)}
                        className="p-2 sm:p-1.5 hover:bg-red-100 rounded-xl text-red-600 transition-colors active:scale-95"
                      >
                        <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Custom Habits */}
        <div className="space-y-2">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-600">Custom Habits</h3>

          <div className="flex gap-2 p-2 sm:p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-md">
            <input
              type="text"
              placeholder="Add custom habit..."
              value={newHabitText}
              onChange={(e) => setNewHabitText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustomHabit()}
              className="flex-1 px-2 sm:px-3 py-2 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            />
            <button onClick={handleAddCustomHabit} className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl text-xs sm:text-sm">
              Add
            </button>
          </div>

          {customHabits.map((habit, index) => (
            <div key={index} className={`group flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${
              habit.status === 'completed'
                ? 'bg-emerald-50 border-emerald-300'
                : habit.status === 'wrong'
                  ? 'bg-red-50 border-red-300'
                  : 'bg-white border-blue-200 hover:border-blue-400'
            }`}>
              {editingHabit === index ? (
                <>
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                    className="flex-1 px-2 py-1 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    autoFocus
                  />
                  <button onClick={handleSaveEdit} className="p-2 sm:p-1.5 hover:bg-blue-100 rounded-xl text-blue-600 transition-colors active:scale-95">
                    <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setEditingHabit(null)}
                    className="p-2 sm:p-1.5 hover:bg-red-100 rounded-xl text-red-600 transition-colors active:scale-95"
                  >
                    <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  {/* 3-state checkbox button */}
                  <button
                    onClick={() => handleToggleCustomHabit(index)}
                    className={`flex-shrink-0 w-8 h-8 sm:w-6 sm:h-6 rounded-xl border-2 flex items-center justify-center transition-all active:scale-95 shadow-sm ${
                      !habit.status || habit.status === 'none'
                        ? 'border-blue-400 hover:border-blue-500 hover:bg-blue-50'
                        : habit.status === 'completed'
                          ? 'bg-emerald-500 border-emerald-500 shadow-md'
                          : 'bg-red-500 border-red-500 shadow-md'
                    }`}
                  >
                    {habit.status === 'completed' && (
                      <svg className="w-5 h-5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {habit.status === 'wrong' && (
                      <svg className="w-5 h-5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                  <span className={`flex-1 text-xs sm:text-sm font-medium ${
                    habit.status === 'completed'
                      ? 'text-slate-500 line-through'
                      : habit.status === 'wrong'
                        ? 'text-red-600'
                        : 'text-slate-700'
                  }`}>
                    {habit.text}
                  </span>
                  <div className="flex gap-1 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEdit(index)}
                      className="p-2 sm:p-1.5 hover:bg-blue-100 rounded-xl text-blue-600 transition-colors active:scale-95"
                    >
                      <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRemoveCustomHabit(index)}
                      className="p-2 sm:p-1.5 hover:bg-red-100 rounded-xl text-red-600 transition-colors active:scale-95"
                    >
                      <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HabitTracker
