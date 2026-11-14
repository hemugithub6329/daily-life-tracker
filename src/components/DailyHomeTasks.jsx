import { useState, useEffect } from 'react'
import storage from '../utils/fileStorage.js'
import { emit, HOME_TASKS_UPDATED } from '../utils/events.js'

function DailyHomeTasks({ selectedDate }) {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [selectedDate])

  // Listen for undo/redo state restoration
  useEffect(() => {
    const handleStateRestored = () => {
      loadTasks()
    }
    window.addEventListener('state-restored', handleStateRestored)
    return () => window.removeEventListener('state-restored', handleStateRestored)
  }, [selectedDate])

  const loadTasks = async () => {
    setIsLoading(true)
    const savedTasks = await storage.getHomeTasks(selectedDate)
    setTasks(savedTasks || [])
    setIsLoading(false)
  }

  const saveTasks = async (newTasks) => {
    await storage.saveHomeTasks(selectedDate, newTasks)
    setTasks(newTasks)
    emit(HOME_TASKS_UPDATED, { date: selectedDate, tasks: newTasks })
  }

  const addTask = () => {
    if (!newTask.trim()) return
    
    const task = {
      id: Date.now().toString(),
      text: newTask.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    }
    
    const updatedTasks = [...tasks, task]
    saveTasks(updatedTasks)
    setNewTask('')
  }

  const toggleTask = (id) => {
    const updatedTasks = tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    )
    saveTasks(updatedTasks)
  }

  const deleteTask = (id) => {
    const updatedTasks = tasks.filter(t => t.id !== id)
    saveTasks(updatedTasks)
  }

  const getStats = () => {
    const total = tasks.length
    const completed = tasks.filter(t => t.completed).length
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
    <div className="bg-white border-2 border-orange-200 rounded-2xl p-3 sm:p-6 shadow-xl hover:shadow-2xl transition-all">
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Daily Home Tasks
        </h2>

        {/* Progress Summary */}
        {tasks.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="text-xs sm:text-sm">
              <span className="text-slate-600 font-semibold">{stats.completed}/{stats.total}</span>
              <span className="text-slate-400 ml-1">({stats.completionRate}%)</span>
            </div>
            <div className="w-16 sm:w-20 h-2 bg-slate-200 rounded-full overflow-hidden border-2 border-orange-200">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Add New Task */}
      <div className="flex gap-2 mb-3 sm:mb-4 p-2 sm:p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 shadow-md">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
          placeholder="e.g., Go to market, Buy groceries, Pay bills..."
          className="flex-1 px-2 sm:px-3 py-2 border-2 border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm"
        />
        <button
          onClick={addTask}
          disabled={!newTask.trim()}
          className="px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-2 max-h-[50vh] sm:max-h-60 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-center py-4 sm:py-6 text-slate-500">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <p className="text-xs sm:text-sm">No tasks set for this day</p>
            <p className="text-xs text-slate-400 mt-1">Add tasks like "Go to market", "Pay bills"</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border-2 transition-all group shadow-sm hover:shadow-md ${
                task.completed
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-white border-orange-200 hover:border-orange-400'
              }`}
            >
              <button
                onClick={() => toggleTask(task.id)}
                className={`flex-shrink-0 w-8 h-8 sm:w-6 sm:h-6 rounded-xl border-2 flex items-center justify-center transition-all active:scale-95 shadow-sm ${
                  task.completed
                    ? 'bg-emerald-500 border-emerald-500 shadow-md'
                    : 'border-orange-400 hover:border-orange-500 hover:bg-orange-50'
                }`}
              >
                {task.completed && (
                  <svg className="w-5 h-5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <span className={`flex-1 text-xs sm:text-sm font-medium ${
                task.completed ? 'text-slate-500 line-through' : 'text-slate-700'
              }`}>
                {task.text}
              </span>

              <button
                onClick={() => deleteTask(task.id)}
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
      {tasks.length > 0 && stats.completionRate < 100 && (
        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-amber-50 border-2 border-amber-200 rounded-xl shadow-sm">
          <p className="text-xs sm:text-sm text-amber-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {stats.completed === 0
              ? "No tasks completed yet. Start now!"
              : `${tasks.length - stats.completed} task(s) remaining. Let's get it done!`}
          </p>
        </div>
      )}

      {stats.completionRate === 100 && tasks.length > 0 && (
        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl shadow-sm">
          <p className="text-sm text-emerald-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All tasks completed! Great job, keep this momentum!
          </p>
        </div>
      )}
    </div>
  )
}

export default DailyHomeTasks
