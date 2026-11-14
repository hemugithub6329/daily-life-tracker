import { useState, useEffect } from 'react'
import storage from '../utils/fileStorage.js'
import { emit, STUDY_TARGETS_UPDATED } from '../utils/events.js'

function DailyStudyTargets({ selectedDate }) {
  const [targets, setTargets] = useState([])
  const [newTarget, setNewTarget] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTargets()
  }, [selectedDate])

  // Listen for undo/redo state restoration
  useEffect(() => {
    const handleStateRestored = () => {
      loadTargets()
    }
    window.addEventListener('state-restored', handleStateRestored)
    return () => window.removeEventListener('state-restored', handleStateRestored)
  }, [selectedDate])

  const loadTargets = async () => {
    setIsLoading(true)
    const savedTargets = await storage.getStudyTargets(selectedDate)
    setTargets(savedTargets || [])
    setIsLoading(false)
  }

  const saveTargets = async (newTargets) => {
    await storage.saveStudyTargets(selectedDate, newTargets)
    setTargets(newTargets)
    emit(STUDY_TARGETS_UPDATED, { date: selectedDate, targets: newTargets })
  }

  const addTarget = () => {
    if (!newTarget.trim()) return
    
    const target = {
      id: Date.now().toString(),
      text: newTarget.trim(),
      planned: true,
      completed: false,
      createdAt: new Date().toISOString()
    }
    
    const updatedTargets = [...targets, target]
    saveTargets(updatedTargets)
    setNewTarget('')
  }

  const toggleTarget = (id) => {
    const updatedTargets = targets.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    )
    saveTargets(updatedTargets)
  }

  const deleteTarget = (id) => {
    const updatedTargets = targets.filter(t => t.id !== id)
    saveTargets(updatedTargets)
  }

  const getStats = () => {
    const total = targets.length
    const completed = targets.filter(t => t.completed).length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, completionRate }
  }

  const stats = getStats()

  if (isLoading) {
    return (
      <div className="glass-card p-3 sm:p-4">
        <div className="animate-pulse space-y-2 sm:space-y-3">
          <div className="h-3 sm:h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-6 sm:h-8 bg-slate-200 rounded"></div>
          <div className="h-6 sm:h-8 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-blue-200 rounded-2xl p-3 sm:p-6 shadow-xl hover:shadow-2xl transition-all">
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Daily Study Targets
        </h2>

        {/* Progress Summary */}
        {targets.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="text-xs sm:text-sm">
              <span className="text-slate-600 font-semibold">{stats.completed}/{stats.total}</span>
              <span className="text-slate-400 ml-1">({stats.completionRate}%)</span>
            </div>
            <div className="w-16 sm:w-20 h-2 bg-slate-200 rounded-full overflow-hidden border-2 border-blue-200">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Add New Target */}
      <div className="flex gap-2 mb-3 sm:mb-4 p-2 sm:p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-md">
        <input
          type="text"
          value={newTarget}
          onChange={(e) => setNewTarget(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTarget()}
          placeholder="e.g., Complete 3 chapters of History, Solve 50 MCQs..."
          className="flex-1 px-2 sm:px-3 py-2 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
        />
        <button
          onClick={addTarget}
          disabled={!newTarget.trim()}
          className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Target List */}
      <div className="space-y-2 max-h-[50vh] sm:max-h-60 overflow-y-auto">
        {targets.length === 0 ? (
          <div className="text-center py-4 sm:py-6 text-slate-500">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-xs sm:text-sm">No targets set for this day</p>
            <p className="text-xs text-slate-400 mt-1">Add specific goals like "Read 2 chapters of Polity"</p>
          </div>
        ) : (
          targets.map((target) => (
            <div
              key={target.id}
              className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border-2 transition-all group shadow-sm hover:shadow-md ${
                target.completed
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-white border-blue-200 hover:border-blue-400'
              }`}
            >
              <button
                onClick={() => toggleTarget(target.id)}
                className={`flex-shrink-0 w-8 h-8 sm:w-6 sm:h-6 rounded-xl border-2 flex items-center justify-center transition-all active:scale-95 shadow-sm ${
                  target.completed
                    ? 'bg-emerald-500 border-emerald-500 shadow-md'
                    : 'border-blue-400 hover:border-blue-500 hover:bg-blue-50'
                }`}
              >
                {target.completed && (
                  <svg className="w-5 h-5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <span className={`flex-1 text-xs sm:text-sm font-medium ${
                target.completed ? 'text-slate-500 line-through' : 'text-slate-700'
              }`}>
                {target.text}
              </span>

              <button
                onClick={() => deleteTarget(target.id)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1 active:scale-95"
              >
                <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Accountability Footer */}
      {targets.length > 0 && stats.completionRate < 100 && (
        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-amber-50 border-2 border-amber-200 rounded-xl shadow-sm">
          <p className="text-xs sm:text-sm text-amber-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {stats.completed === 0
              ? "No targets completed yet. Start now!"
              : `${targets.length - stats.completed} target(s) remaining. Push through!`}
          </p>
        </div>
      )}

      {stats.completionRate === 100 && targets.length > 0 && (
        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl shadow-sm">
          <p className="text-sm text-emerald-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All targets completed! Great job, keep this momentum!
          </p>
        </div>
      )}
    </div>
  )
}

export default DailyStudyTargets
