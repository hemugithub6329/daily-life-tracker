import { useState, useEffect } from 'react'
import { getRandomQuote } from '../utils/dateUtils.js'
import { emit, EVENTS } from '../utils/events.js'

function DailyQuote({ quotes, changeTrigger = 0, usedQuotes = [], setUsedQuotes = () => {} }) {
  const [dailyQuote, setDailyQuote] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const changeQuote = () => {
    if (quotes.length === 0) return
    
    // Get random quote avoiding immediate repeats
    const newQuote = getRandomQuote(quotes, usedQuotes)
    setDailyQuote(newQuote)
    
    // Add to used quotes (keep last 5 to avoid repetition)
    if (newQuote) {
      setUsedQuotes(prev => {
        const updated = [...prev, newQuote]
        // Keep only last 5 to avoid long-term repetition
        return updated.slice(-5)
      })
    }
    
    // Emit event to notify other components quote changed
    emit(EVENTS.QUOTE_CHANGED, { quote: newQuote })
  }

  useEffect(() => {
    changeQuote()
  }, [quotes, changeTrigger])

  const handleRefreshClick = () => {
    setIsRefreshing(true)
    // Simulate a brief animation
    setTimeout(() => {
      changeQuote()
      setIsRefreshing(false)
    }, 300)
  }

  if (!dailyQuote) return null

  return (
    <div className="bg-white border-2 border-blue-200 rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 text-white shadow-lg">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-base sm:text-lg font-medium italic leading-relaxed text-slate-700">
            "{dailyQuote}"
          </p>
          <p className="text-xs sm:text-sm mt-2 text-blue-600 font-semibold">Daily Inspiration</p>
        </div>
        {/* Refresh Button */}
        <button
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          className="flex-shrink-0 p-2 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 transition-all shadow-sm hover:shadow-md active:scale-95"
          title="Get a new quote"
        >
          <svg
            className={`w-5 h-5 text-blue-600 transition-transform duration-300 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default DailyQuote
