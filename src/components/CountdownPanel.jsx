import { useState, useEffect } from 'react'
import storage from '../utils/fileStorage.js'
import { calculateCountdown, formatDisplayDate } from '../utils/dateUtils.js'
import { emit, on, EVENTS, COUNTDOWN_UPDATED } from '../utils/events.js'

function CountdownPanel() {
  const [targetDate, setTargetDate] = useState('')
  const [targetTitle, setTargetTitle] = useState('')
  const [countdown, setCountdown] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const loadCountdown = async () => {
      const data = await storage.getCountdown()
      if (data) {
        setTargetDate(data.date)
        setTargetTitle(data.title)
        updateCountdown(data.date)
      }
    }
    loadCountdown()
    
    // Listen for undo/redo events
    const unsubscribeCountdown = on(EVENTS.COUNTDOWN_UPDATED, (payload) => {
      if (payload?.action === 'undo' || payload?.action === 'redo') {
        loadCountdown()
      }
    })
    
    return () => unsubscribeCountdown()
  }, [])

  const updateCountdown = (date) => {
    if (date) {
      setCountdown(calculateCountdown(date))
    }
  }

  useEffect(() => {
    if (!targetDate) return
    
    updateCountdown(targetDate)
    const interval = setInterval(() => updateCountdown(targetDate), 60000)
    return () => clearInterval(interval)
  }, [targetDate])

  const handleSave = async () => {
    if (targetDate && targetTitle) {
      const data = { date: targetDate, title: targetTitle }
      await storage.saveCountdown(data)
      updateCountdown(targetDate)
      setIsEditing(false)
      emit(COUNTDOWN_UPDATED, data)
    }
  }

  const handleClear = async () => {
    setTargetDate('')
    setTargetTitle('')
    setCountdown(null)
    await storage.saveCountdown(null)
    setIsEditing(false)
    emit(COUNTDOWN_UPDATED, null)
  }

  // Get color based on days remaining - professional muted palette
  const getCountdownStyle = (days) => {
    if (days < 0) return 'bg-slate-500 text-white'        // Past date
    if (days <= 7) return 'bg-slate-800 text-white'      // Urgent: <7 days
    if (days <= 14) return 'bg-slate-600 text-white'      // Near: 7-14 days
    if (days <= 30) return 'bg-slate-500 text-white'      // Mid: 15-30 days
    return 'bg-slate-400 text-white'                      // Far: >30 days
  }

  const getDaysStyle = getCountdownStyle

  const styleClass = countdown ? getDaysStyle(countdown.days) : 'bg-slate-400 text-white'

  return (
    <div className="bg-white border-2 border-blue-200 rounded-xl p-6 h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Countdown
        </h2>
      </div>

      <div className="flex-grow flex flex-col">
        {isEditing ? (
          <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
            <input
              type="text"
              placeholder="Target name (e.g., Exam Date)"
              value={targetTitle}
              onChange={(e) => setTargetTitle(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button onClick={handleSave} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md flex-1">
                Save
              </button>
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-all flex-1">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center flex-grow flex flex-col justify-center">
            {countdown ? (
              <>
                <p className="text-slate-700 mb-2 font-medium text-lg">{targetTitle}</p>
                <p className="text-sm text-slate-600 mb-4">{formatDisplayDate(new Date(targetDate))}</p>

                <div className={`${styleClass} rounded-xl p-6 mb-4 shadow-lg`}>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-white">{countdown.days}</span>
                  </div>
                  <p className="text-white/90 text-sm mt-1 font-medium">{countdown.message}</p>
                </div>

                <div className="flex gap-2 justify-center">
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md text-sm">
                    Edit
                  </button>
                  <button onClick={handleClear} className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-all text-sm">
                    Clear
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-500 mb-4">No countdown set</p>
                <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md">
                  Set Countdown
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CountdownPanel
