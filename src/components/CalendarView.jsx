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
  isSameDay,
  isFuture,
  isToday
} from 'date-fns'
import { formatDate } from '../utils/dateUtils.js'
import { on, EVENTS } from '../utils/events.js'

function CalendarView({ fixedHabits, selectedDate, onDateChange }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState([])
  const [habitsData, setHabitsData] = useState({})

  useEffect(() => {
    loadCalendarData()
    
    const unsubscribe = on(EVENTS.HABITS_UPDATED, () => {
      loadCalendarData()
    })
    
    return () => unsubscribe()
  }, [currentMonth])

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
    const dateData = {}
    days.forEach(day => {
      const key = formatDate(day)
      if (allData[key]) {
        dateData[key] = allData[key]
      }
    })
    setHabitsData(dateData)
  }

  const getDayStats = (date) => {
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

  // Get day box styling with bar fill visualization
  const getDayStyle = (stats, isSelected, isToday, isCurrentMonth) => {
    const baseClasses = 'aspect-square rounded-lg border-2 transition-all hover:scale-105 flex flex-col items-center justify-center relative overflow-hidden'
    
    // Selection ring
    if (isSelected) return `${baseClasses} border-blue-600 ring-2 ring-blue-500 ring-offset-1`
    if (isToday) return `${baseClasses} border-blue-400 ring-2 ring-blue-400 ring-offset-1`
    
    // All days get blue border
    return `${baseClasses} border-blue-300 bg-white`
  }

  // Get fill percentage for the bar
  const getFillPercentage = (stats) => {
    return stats.percentage || 0
  }

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1))
  }

  const handleDayClick = (day) => {
    const dateKey = formatDate(day)
    onDateChange(dateKey)
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Calculate monthly stats
  const monthlyStats = {
    totalDays: 0,
    perfectDays: 0,
    goodDays: 0,
    partialDays: 0
  }

  calendarDays.forEach(day => {
    if (isSameMonth(day, currentMonth) && !isFuture(day)) {
      monthlyStats.totalDays++
      const stats = getDayStats(day)
      if (stats.percentage === 100) monthlyStats.perfectDays++
      else if (stats.percentage >= 60) monthlyStats.goodDays++
      else if (stats.percentage >= 20) monthlyStats.partialDays++
    }
  })

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Habit Calendar
        </h2>
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
          <button 
            onClick={handlePrevMonth} 
            className="p-1.5 hover:bg-white rounded-md transition-colors text-slate-600 hover:text-slate-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-slate-700 min-w-[80px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button 
            onClick={handleNextMonth} 
            className="p-1.5 hover:bg-white rounded-md transition-colors text-slate-600 hover:text-slate-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Month Stats Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{monthlyStats.perfectDays}</div>
          <div className="text-xs text-slate-500">Perfect</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-500">{monthlyStats.goodDays}</div>
          <div className="text-xs text-slate-500">Good</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">{monthlyStats.partialDays}</div>
          <div className="text-xs text-slate-500">Partial</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-slate-600">{monthlyStats.totalDays}</div>
          <div className="text-xs text-slate-500">Days</div>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-slate-500 py-1.5">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 flex-grow">
        {calendarDays.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isTodayDate = isToday(day)
          const isSelected = formatDate(day) === selectedDate
          const stats = getDayStats(day)
          
          if (!isCurrentMonth) {
            return (
              <div 
                key={index} 
                className="aspect-square rounded-lg bg-slate-50 opacity-30"
              />
            )
          }
          
          return (
            <button
              key={index}
              onClick={() => handleDayClick(day)}
              className={getDayStyle(stats, isSelected, isTodayDate, isCurrentMonth)}
            >
              {/* Background fill bar - rises from bottom based on completion % */}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-blue-400 opacity-40 transition-all duration-300 rounded-b-lg"
                style={{ height: `${getFillPercentage(stats)}%` }}
              />
              
              {/* Content - day number and stats positioned on top */}
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <span className="text-sm font-bold leading-tight text-slate-800">
                  {format(day, 'd')}
                </span>
                {stats.total > 0 && (
                  <span className="text-[10px] leading-tight font-medium text-slate-700">
                    {stats.completed}/{stats.total}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-medium">Fill Level:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded border-2 border-blue-300 bg-white"></div>
            <span className="text-slate-500">0% (Empty)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded border-2 border-blue-300 bg-gradient-to-t from-blue-400 to-white"></div>
            <span className="text-slate-500">50% (Half)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded border-2 border-blue-300 bg-blue-400"></div>
            <span className="text-slate-500">100% (Full)</span>
          </div>
        </div>
        <span className="text-slate-400 italic">Click any day to view habits</span>
      </div>
    </div>
  )
}

export default CalendarView
