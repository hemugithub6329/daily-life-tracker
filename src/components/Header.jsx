import { format, parseISO } from 'date-fns'
import { getToday } from '../utils/dateUtils.js'

function Header({ 
  onQuotesClick, 
  onDailyNotesClick, 
  onMisfitsClick, 
  onGoalsClick,
  onResetClick,
  onExportClick,
  onImportClick,
  selectedDate,
  streak = 0
}) {
  const today = getToday()
  const todayLabel = format(parseISO(today), 'EEE, MMM d, yyyy')
  const selectedDateLabel = format(parseISO(selectedDate), 'EEE, MMM d, yyyy')

  const buttons = [
    {
      id: 'quotes',
      variant: 'primary',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      label: 'Quotes',
      onClick: onQuotesClick,
      priority: 'normal'
    },
    {
      id: 'dailynotes',
      variant: 'primary',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Calendar',
      onClick: onDailyNotesClick,
      priority: 'normal'
    },
    {
      id: 'misfits',
      variant: 'primary',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      label: 'Misfits',
      onClick: onMisfitsClick,
      priority: 'normal'
    },
    {
      id: 'goals',
      variant: 'primary',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l5 5L20 7" />
        </svg>
      ),
      label: 'Goals',
      onClick: onGoalsClick,
      priority: 'normal'
    },
    {
      id: 'export',
      variant: 'secondary',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      label: 'Export',
      onClick: onExportClick,
      priority: 'low'
    },
    {
      id: 'import',
      variant: 'secondary',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" transform="rotate(180 12 12)" />
        </svg>
      ),
      label: 'Import',
      onClick: onImportClick,
      priority: 'low'
    },
    {
      id: 'reset',
      variant: 'danger',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      label: 'Reset',
      onClick: onResetClick,
      priority: 'low'
    },
    {
      id: 'streak',
      variant: 'accent',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
      ),
      label: `${streak} Day${streak !== 1 ? 's' : ''}`,
      onClick: () => {},
      priority: 'high'
    }
  ]

  const getButtonClasses = (btn) => {
    const baseClasses = 'rounded-xl p-2.5 sm:p-3 transition-all duration-300 flex flex-col items-center gap-1.5 text-sm font-medium min-w-[70px] sm:min-w-[85px] shadow-md hover:shadow-xl'
    
    if (btn.disabled) {
      return `${baseClasses} bg-slate-100/50 text-slate-400 cursor-not-allowed`
    }
    
    if (btn.variant === 'primary') {
      return `${baseClasses} bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95`
    }
    
    if (btn.variant === 'secondary') {
      return `${baseClasses} bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 hover:scale-105 active:scale-95`
    }
    
    if (btn.variant === 'accent') {
      return `${baseClasses} bg-slate-800 text-white hover:bg-slate-700 shadow-sm hover:scale-105 active:scale-95`
    }
    
    if (btn.variant === 'danger') {
      return `${baseClasses} bg-white text-red-600 hover:bg-red-50 border border-slate-200 hover:scale-105 shadow-sm hover:shadow-md active:scale-95`
    }
    
    return baseClasses
  }

  return (
    <header className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-3 sm:p-5 md:p-6 mb-3 sm:mb-5 md:mb-6 shadow-2xl border border-white/20">
      {/* Mobile-optimized header */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
              Daily Tracker
            </h1>
            <p className="text-xs sm:text-sm text-white/80 hidden sm:block">Track your progress, achieve your goals</p>
            <p className="text-[10px] sm:text-xs text-white/90 mt-0.5">
              Today: {todayLabel}
            </p>
            {selectedDate !== today && (
              <p className="text-[10px] sm:text-xs text-white font-semibold">
                Viewing: {selectedDateLabel}
              </p>
            )}
          </div>
        </div>
        
        {/* Streak badge - enhanced design */}
        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-lg border border-white/30">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold text-white leading-tight">{streak}</span>
            <span className="text-[10px] sm:text-xs text-white/80 leading-tight">Day{streak !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
      
      {/* Action buttons - hide on mobile, show on tablet+ */}
      <div className="hidden sm:flex justify-center">
        <div className="grid grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 w-full max-w-5xl">
          {buttons.map((btn) => (
            <button
              key={btn.id}
              onClick={btn.onClick}
              disabled={btn.disabled}
              className={getButtonClasses(btn)}
              title={btn.label}
            >
              {btn.icon}
              <span className="text-xs sm:text-sm">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}

export default Header
