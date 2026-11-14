import { useState } from 'react'
import { useAppBackHandler } from '../utils/backNavigation.js'

function MobileBottomNav({
  onQuotesClick,
  onDailyNotesClick,
  onMisfitsClick,
  onGoalsClick,
  onResetClick,
  onExportClick,
  onImportClick,
  onAppLimitsClick,
  streak = 0
}) {
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  useAppBackHandler(() => {
    if (!showMoreMenu) return false
    setShowMoreMenu(false)
    return true
  }, true, 20)

  const navItems = [
    {
      id: 'quotes',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      label: 'Quotes',
      onClick: onQuotesClick
    },
    {
      id: 'dailynotes',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Calendar',
      onClick: onDailyNotesClick
    },
    {
      id: 'misfits',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      label: 'Misfits',
      onClick: onMisfitsClick
    },
    {
      id: 'goals',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l5 5L20 7" />
        </svg>
      ),
      label: 'Goals',
      onClick: onGoalsClick
    },
    {
      id: 'more',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      ),
      label: 'More',
      onClick: () => setShowMoreMenu(!showMoreMenu)
    }
  ]

  return (
    <>
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-500 backdrop-blur-lg border-t border-white/20 shadow-2xl sm:hidden z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 pb-safe">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-white/90 hover:text-white active:text-white active:scale-95 transition-all min-w-[60px] min-h-[64px]"
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>

    {/* Mobile More Menu */}
    {showMoreMenu && (
      <div className="fixed inset-0 bg-black/50 z-50 sm:hidden" onClick={() => setShowMoreMenu(false)}>
        <div className="absolute bottom-16 left-0 right-0 bg-white rounded-t-xl shadow-2xl p-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">More Options</h3>
          <div className="space-y-2">
            {onAppLimitsClick && (
              <button
                onClick={() => {
                  setShowMoreMenu(false)
                  onAppLimitsClick()
                }}
                className="w-full rounded-lg bg-indigo-50 px-4 py-3 text-left flex items-center gap-3 hover:bg-indigo-100 active:bg-indigo-200 transition-colors"
              >
                <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4zm-3 9l2 2 4-4" />
                </svg>
                <span className="font-medium text-indigo-800">App Limits</span>
              </button>
            )}
            <button
              onClick={() => {
                setShowMoreMenu(false)
                onExportClick()
              }}
              className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-3 active:bg-slate-200 transition-colors"
            >
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-slate-700 font-medium">Export Data</span>
            </button>
            <button
              onClick={() => {
                setShowMoreMenu(false)
                onImportClick()
              }}
              className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-3 active:bg-slate-200 transition-colors"
            >
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="text-slate-700 font-medium">Import Data</span>
            </button>
            <button
              onClick={() => {
                setShowMoreMenu(false)
                onResetClick()
              }}
              className="w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-3 active:bg-red-200 transition-colors"
            >
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 011-1h2a1 1 0 011 1v3M4 7h16" />
              </svg>
              <span className="text-red-600 font-medium">Reset All Data</span>
            </button>
          </div>
          <button
            onClick={() => setShowMoreMenu(false)}
            className="w-full mt-4 px-4 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold text-slate-700 active:bg-slate-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )}
    </>
  )
}

export default MobileBottomNav