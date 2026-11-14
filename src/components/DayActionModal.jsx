import { useAppBackHandler } from '../utils/backNavigation.js'

function DayActionModal({ date, onClose, onMoveToDay, onOpenNotes }) {
  useAppBackHandler(() => {
    onClose()
    return true
  }, true, 30)

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full h-dvh sm:h-auto sm:max-w-sm modal-enter overflow-hidden flex flex-col justify-center">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-5 text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">
            {date}
          </h3>
          <p className="text-white/80 text-sm">
            Choose an action
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-3">
          {/* Move to this day */}
          <button
            onClick={() => {
              onMoveToDay(date)
              onClose()
            }}
            className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-left shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white">Move to this day</h4>
                  <p className="text-white/80 text-xs mt-0.5">
                    View habits, targets & progress
                  </p>
                </div>
              </div>
            </div>
          </button>

          {/* Open notes */}
          <button
            onClick={() => {
              onOpenNotes(date)
              onClose()
            }}
            className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-left shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white">Open notes</h4>
                  <p className="text-white/80 text-xs mt-0.5">
                    Read or edit daily notes
                  </p>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Cancel button */}
        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default DayActionModal