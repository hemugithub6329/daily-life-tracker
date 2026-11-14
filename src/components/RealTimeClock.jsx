import { useState, useEffect, useRef } from 'react'
import storage from '../utils/fileStorage.js'
import { getToday } from '../utils/dateUtils.js'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { emit, EVENTS, on } from '../utils/events.js'

const StudyStopwatch = registerPlugin('StudyStopwatch')

const getDateRange = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number)
  const start = new Date(year, month - 1, day)
  const end = new Date(year, month - 1, day + 1)
  return { start: start.getTime(), end: end.getTime() }
}

const splitSessionByDate = (session) => {
  const startTime = new Date(session.startTime).getTime()
  const endTime = new Date(session.endTime).getTime()
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) return []

  const totalDuration = Math.max(0, Math.floor(session.duration || (endTime - startTime) / 1000))
  const totalWallSeconds = Math.max(1, Math.floor((endTime - startTime) / 1000))
  const segments = []
  let cursor = startTime
  let assignedDuration = 0

  while (cursor < endTime) {
    const cursorDate = new Date(cursor)
    const nextMidnight = new Date(
      cursorDate.getFullYear(),
      cursorDate.getMonth(),
      cursorDate.getDate() + 1
    ).getTime()
    const segmentEnd = Math.min(endTime, nextMidnight)
    const segmentWallSeconds = Math.floor((segmentEnd - cursor) / 1000)
    const isLastSegment = segmentEnd === endTime
    const duration = isLastSegment
      ? totalDuration - assignedDuration
      : Math.floor(totalDuration * segmentWallSeconds / totalWallSeconds)
    const date = [
      cursorDate.getFullYear(),
      String(cursorDate.getMonth() + 1).padStart(2, '0'),
      String(cursorDate.getDate()).padStart(2, '0')
    ].join('-')

    segments.push({
      date,
      session: {
        ...session,
        id: `${session.id}:${date}`,
        startTime: new Date(cursor).toISOString(),
        endTime: new Date(segmentEnd).toISOString(),
        duration
      }
    })
    assignedDuration += duration
    cursor = segmentEnd
  }

  return segments
}

function RealTimeClock({ selectedDate }) {
  const [time, setTime] = useState(new Date())
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [stopwatchStartedAt, setStopwatchStartedAt] = useState(null)
  const [selectedDayStudyTime, setSelectedDayStudyTime] = useState(0)
  const [sessions, setSessions] = useState([])
  const handledSessionIds = useRef(new Set())
  const selectedDateRef = useRef(selectedDate)
  selectedDateRef.current = selectedDate

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000) // Update every second

    return () => clearInterval(timer)
  }, [])

  const saveStoppedSession = async (session) => {
    if (!session?.id || handledSessionIds.current.has(session.id)) return
    handledSessionIds.current.add(session.id)

    try {
      const segments = splitSessionByDate(session)
      for (const { date, session: daySession } of segments) {
        const savedSessions = await storage.getStudySessions(date)
        if (savedSessions.some(saved => saved.id === daySession.id)) continue
        await storage.saveStudySessions(date, [...savedSessions, daySession])
        emit(EVENTS.STUDY_SESSIONS_UPDATED, { date })
      }
      await loadSessions(selectedDate)
    } catch (error) {
      handledSessionIds.current.delete(session.id)
      console.error('Error saving study session:', error)
      alert('The study session could not be saved. Please try again.')
    }
  }

  const syncNativeStopwatch = async () => {
    if (!Capacitor.isNativePlatform()) return

    try {
      const state = await StudyStopwatch.getState()
      setIsRunning(state.running)
      if (state.running && state.startTime) {
        setStopwatchStartedAt(state.startTime)
        setElapsedTime(Math.floor((Date.now() - state.startTime) / 1000))
      } else {
        setStopwatchStartedAt(null)
        setElapsedTime(0)
        if (state.lastSession) await saveStoppedSession(state.lastSession)
      }
    } catch (error) {
      console.error('Error syncing Android stopwatch:', error)
    }
  }

  // Load study sessions and restore a stopwatch that is still running in Android.
  useEffect(() => {
    const initializeStopwatch = async () => {
      await syncNativeStopwatch()
    }
    initializeStopwatch()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncNativeStopwatch()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', syncNativeStopwatch)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', syncNativeStopwatch)
    }
  }, [selectedDate])

  // Derive elapsed time from the start timestamp so background throttling cannot lose time.
  useEffect(() => {
    if (!isRunning || !stopwatchStartedAt) return
    const updateElapsedTime = () => setElapsedTime(Math.floor((Date.now() - stopwatchStartedAt) / 1000))
    updateElapsedTime()
    const interval = setInterval(updateElapsedTime, 1000)
    return () => clearInterval(interval)
  }, [isRunning, stopwatchStartedAt])

  useEffect(() => {
    loadSessions(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    const unsubscribe = on(EVENTS.STUDY_SESSIONS_UPDATED, ({ date }) => {
      if (date === selectedDate) loadSessions(selectedDate)
    })
    return unsubscribe
  }, [selectedDate])

  const loadSessions = async (date) => {
    const savedSessions = await storage.getStudySessions(date)
    if (date !== selectedDateRef.current) return
    setSessions(savedSessions || [])

    const totalSeconds = (savedSessions || []).reduce((sum, session) => sum + session.duration, 0)
    setSelectedDayStudyTime(totalSeconds)
  }

  const resetSelectedDayStudyTime = async () => {
    const dateLabel = selectedDate === getToday() ? "today's" : `${selectedDate}'s`
    if (!window.confirm(`Reset ${dateLabel} saved study time? A currently running stopwatch will keep counting.`)) return

    try {
      await storage.saveStudySessions(selectedDate, [])
      emit(EVENTS.STUDY_SESSIONS_UPDATED, { date: selectedDate })
      setSessions([])
      setSelectedDayStudyTime(0)
    } catch (error) {
      console.error('Could not reset selected-day study time:', error)
      alert('Could not reset the study time. Please try again.')
    }
  }

  const { start: selectedDayStart, end: selectedDayEnd } = getDateRange(selectedDate)
  const activeSecondsForSelectedDay = isRunning && stopwatchStartedAt
    ? Math.max(0, Math.floor((
      Math.min(time.getTime(), selectedDayEnd) - Math.max(stopwatchStartedAt, selectedDayStart)
    ) / 1000))
    : 0
  const studyTimeForSelectedDay = selectedDayStudyTime + activeSecondsForSelectedDay

  const startStopwatch = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const state = await StudyStopwatch.start()
        setStopwatchStartedAt(state.startTime)
      } catch (error) {
        console.error('Error starting Android stopwatch:', error)
        alert(error?.message || 'Could not start the stopwatch notification. Check notification permission and try again.')
        return
      }
    } else {
      setStopwatchStartedAt(Date.now())
    }
    setIsRunning(true)
  }

  const stopStopwatch = async () => {
    let stoppedAt = Date.now()
    let startedAt = stopwatchStartedAt
    if (Capacitor.isNativePlatform()) {
      try {
        const state = await StudyStopwatch.stop()
        if (state.lastSession) {
          await saveStoppedSession(state.lastSession)
          setIsRunning(false)
          setStopwatchStartedAt(null)
          setElapsedTime(0)
          return
        }
        stoppedAt = state.stoppedAt || stoppedAt
        startedAt = state.startTime || startedAt
      } catch (error) {
        console.error('Error stopping Android stopwatch:', error)
        alert('Could not stop the Android stopwatch. Please try again.')
        return
      }
    }

    setIsRunning(false)
    setStopwatchStartedAt(null)
    if (elapsedTime > 0) {
      const startTime = startedAt || (stoppedAt - elapsedTime * 1000)
      const newSession = {
        id: Date.now().toString(),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(stoppedAt).toISOString(),
        duration: elapsedTime
      }
      await saveStoppedSession(newSession)
      setElapsedTime(0)
    }
  }

  const resetStopwatch = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await StudyStopwatch.reset()
      } catch (error) {
        console.error('Error resetting Android stopwatch:', error)
        alert('Could not reset the Android stopwatch. Please try again.')
        return
      }
    }
    setIsRunning(false)
    setStopwatchStartedAt(null)
    setElapsedTime(0)
  }

  const formatStopwatchTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Format time with seconds
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  // Calculate today's completed time (since midnight)
  const getCompletedTime = () => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(0, 0, 0, 0)
    
    const diff = now - midnight
    const totalSeconds = Math.floor(diff / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    return { hours, minutes, seconds }
  }

  // Calculate today's remaining time (exactly 24 hours - completed time)
  const getRemainingTime = () => {
    const completed = getCompletedTime()
    const totalSecondsInDay = 24 * 60 * 60
    const completedSeconds = completed.hours * 3600 + completed.minutes * 60 + completed.seconds
    const remainingSeconds = totalSecondsInDay - completedSeconds
    
    const hours = Math.floor(remainingSeconds / 3600)
    const minutes = Math.floor((remainingSeconds % 3600) / 60)
    const seconds = remainingSeconds % 60
    
    return { hours, minutes, seconds }
  }

  // Calculate clock hands angles
  const getClockAngles = () => {
    const hours = time.getHours() % 12
    const minutes = time.getMinutes()
    const seconds = time.getSeconds()
    
    // Clock starts at 12 o'clock (top), so we don't need -90 offset
    const secondAngle = seconds * 6 // 6 degrees per second
    const minuteAngle = minutes * 6 + seconds * 0.1 // 6 degrees per minute + smooth movement
    const hourAngle = hours * 30 + minutes * 0.5 // 30 degrees per hour + smooth movement
    
    return { hourAngle, minuteAngle, secondAngle }
  }

  const { hourAngle, minuteAngle, secondAngle } = getClockAngles()
  const completed = getCompletedTime()
  const remaining = getRemainingTime()

  const formatDuration = (hours, minutes, seconds) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Real-Time Clock
      </h2>

      {/* Time Quote */}
      <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
        <p className="text-sm font-bold text-slate-700 text-center italic">
          "Time wasted is life wasted. Your future self is watching."
        </p>
        <p className="text-xs text-slate-600 text-center mt-1 font-semibold">- No Second to Waste</p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        {/* Analog Clock */}
        <div className="relative w-32 h-32 bg-white rounded-full shadow-lg border-4 border-blue-200">
          {/* Clock face numbers */}
          <div className="absolute inset-0">
            {[12, 3, 6, 9].map((num, index) => {
              const positions = {
                12: 'top-2 left-1/2 -translate-x-1/2',
                3: 'right-2 top-1/2 -translate-y-1/2',
                6: 'bottom-2 left-1/2 -translate-x-1/2',
                9: 'left-2 top-1/2 -translate-y-1/2'
              }
              return (
                <div
                  key={num}
                  className={`absolute text-sm font-bold text-slate-700 ${positions[num]}`}
                >
                  {num}
                </div>
              )
            })}
          </div>

          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-slate-800 rounded-full -translate-x-1/2 -translate-y-1/2 z-30"></div>

          {/* Hour hand */}
          <div
            className="absolute top-1/2 left-1/2 w-1 h-8 bg-slate-800 rounded-full"
            style={{
              transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`,
              transformOrigin: 'center bottom'
            }}
          ></div>

          {/* Minute hand */}
          <div
            className="absolute top-1/2 left-1/2 w-0.5 h-10 bg-slate-600 rounded-full"
            style={{
              transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`,
              transformOrigin: 'center bottom'
            }}
          ></div>

          {/* Second hand */}
          <div
            className="absolute top-1/2 left-1/2 w-0.5 h-11 bg-blue-500 rounded-full z-20"
            style={{
              transform: `translate(-50%, -100%) rotate(${secondAngle}deg)`,
              transformOrigin: 'center bottom'
            }}
          ></div>
        </div>

        {/* Digital Time */}
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-slate-800 bg-slate-100 px-4 py-2 rounded-lg border border-blue-200">
            {formatTime(time)}
          </div>
          <div className="text-xs text-slate-600 mt-1">Indian Standard Time</div>
        </div>

        {/* Today's Completed Time */}
        <div className="w-full bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border-2 border-emerald-200">
          <div className="text-center">
            <div className="text-sm font-medium text-emerald-700 mb-1">Today Completed</div>
            <div className="text-2xl font-mono font-bold text-emerald-800">
              {formatDuration(completed.hours, completed.minutes, completed.seconds)}
            </div>
            <div className="text-xs text-emerald-600">Since midnight</div>
          </div>
        </div>

        {/* Today's Remaining Time */}
        <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border-2 border-amber-200">
          <div className="text-center">
            <div className="text-sm font-medium text-amber-700 mb-1">Today Remaining</div>
            <div className="text-2xl font-mono font-bold text-amber-800">
              {formatDuration(remaining.hours, remaining.minutes, remaining.seconds)}
            </div>
            <div className="text-xs text-amber-600">Until next midnight</div>
          </div>
        </div>

        {/* Study Stopwatch */}
        <div className="w-full bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border-2 border-purple-200">
          <div className="text-center mb-3">
            <div className="text-sm font-medium text-purple-700 mb-1">Study Stopwatch</div>
            <div className="text-3xl font-mono font-bold text-purple-800 bg-white px-4 py-2 rounded-lg border border-purple-300">
              {formatStopwatchTime(elapsedTime)}
            </div>
          </div>
          <div className="flex gap-2 justify-center">
            {!isRunning ? (
              <button
                onClick={startStopwatch}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md active:scale-95 text-sm min-h-[44px]"
              >
                Start
              </button>
            ) : (
              <button
                onClick={stopStopwatch}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-lg hover:from-red-600 hover:to-rose-600 transition-all shadow-md active:scale-95 text-sm min-h-[44px]"
              >
                Stop
              </button>
            )}
            <button
              onClick={resetStopwatch}
              className="px-4 py-2 bg-gradient-to-r from-slate-500 to-gray-500 text-white font-semibold rounded-lg hover:from-slate-600 hover:to-gray-600 transition-all shadow-md active:scale-95 text-sm min-h-[44px]"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Selected Day's Total Study Time */}
        <div className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border-2 border-blue-200">
          <div className="text-center">
            <div className="text-sm font-medium text-blue-700 mb-1">
              {selectedDate === getToday() ? "Today's Study Time" : `Study Time · ${selectedDate}`}
            </div>
            <div className="text-2xl font-mono font-bold text-blue-800">
              {formatStopwatchTime(studyTimeForSelectedDay)}
            </div>
            <div className="text-xs text-blue-600">
              Total from {sessions.length + (activeSecondsForSelectedDay > 0 ? 1 : 0)} session(s)
            </div>
            <button
              type="button"
              onClick={resetSelectedDayStudyTime}
              disabled={sessions.length === 0}
              className="mt-3 rounded-lg border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset saved study time
            </button>
            {isRunning && activeSecondsForSelectedDay > 0 && (
              <p className="mt-2 text-xs text-blue-600">The active stopwatch continues and is not reset.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealTimeClock
