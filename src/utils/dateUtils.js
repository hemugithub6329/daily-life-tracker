import { format, startOfWeek, addDays, isSameDay, parseISO, subDays } from 'date-fns'

export const formatDate = (date) => {
  return format(date, 'yyyy-MM-dd')
}

export const formatDisplayDate = (date) => {
  return format(date, 'MMMM dd, yyyy')
}

export const getToday = () => {
  return formatDate(new Date())
}

export const getDaysInWeek = (date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export const calculateCountdown = (targetDate) => {
  if (!targetDate) return { days: 0, message: 'No target date set' }
  
  const target = parseISO(targetDate)
  const now = new Date()
  const diffTime = target - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return { days: Math.abs(diffDays), message: 'days overdue' }
  } else if (diffDays === 0) {
    return { days: 0, message: 'Today is the day!' }
  } else {
    return { days: diffDays, message: 'days remaining' }
  }
}

export const getHabitCompletionColor = (completed, total) => {
  if (total === 0) return 'bg-gray-200'
  const percentage = (completed / total) * 100
  
  if (percentage === 100) return 'bg-green-500'
  if (percentage >= 85) return 'bg-green-400'
  if (percentage >= 50) return 'bg-green-300'
  if (percentage >= 25) return 'bg-green-200'
  return 'bg-red-200'
}

// Calculate progress for a given day
export const calculateProgress = (habits, customHabits) => {
  // habits is object {habitName: boolean}
  // customHabits is array [{text, status}]
  const fixedCompleted = Object.values(habits).filter(Boolean).length
  const customCompleted = customHabits.filter(h => h.status === 'completed').length
  const totalCompleted = fixedCompleted + customCompleted
  const totalHabits = Object.keys(habits).length + customHabits.length
  
  return totalHabits > 0 ? (totalCompleted / totalHabits) * 100 : 0
}

// Calculate streak of consecutive 100% days
export const calculateStreak = (allData, fixedHabitsList) => {
  if (!allData || Object.keys(allData).length === 0) return 0
  
  const today = new Date()
  let streak = 0
  let skippedToday = false
  
  for (let i = 0; i < 365; i++) {
    const checkDate = subDays(today, i)
    const dateKey = formatDate(checkDate)
    const dayData = allData[dateKey]
    
    // If no data for this date
    if (!dayData) {
      // Skip today if it has no data (user hasn't tracked yet)
      if (i === 0) {
        skippedToday = true
        continue
      }
      break
    }
    
    const habits = dayData.habits || {}
    const customHabits = dayData.customHabits || []
    
    // Calculate completion
    const fixedCompleted = Object.values(habits).filter(Boolean).length
    const customCompleted = customHabits.filter(h => h.status === 'completed').length
    const totalCompleted = fixedCompleted + customCompleted
    const totalHabits = Object.keys(habits).length + customHabits.length
    
    if (totalHabits === 0) {
      if (i === 0 || skippedToday) continue
      break
    }
    
    const percentage = (totalCompleted / totalHabits) * 100
    
    if (percentage === 100) {
      streak++
    } else if (i === 0 || (i === 1 && skippedToday)) {
      // Don't break for today if incomplete (give them time)
      continue
    } else {
      break
    }
  }
  
  return streak
}

// Get random quote ensuring no immediate repeats
export const getRandomQuote = (quotes, usedQuotes = []) => {
  if (quotes.length === 0) return ''
  if (quotes.length === 1) return quotes[0]
  
  // Filter out recently used quotes
  const available = quotes.filter(q => !usedQuotes.includes(q))
  
  // If all quotes were used, reset
  const pool = available.length > 0 ? available : quotes
  
  return pool[Math.floor(Math.random() * pool.length)]
}
