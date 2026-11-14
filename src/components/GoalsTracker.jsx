import { useState, useEffect } from 'react'
import storage from '../utils/fileStorage.js'
import { emit, EVENTS } from '../utils/events.js'
import { useAppBackHandler } from '../utils/backNavigation.js'

function GoalsTracker({ onClose }) {
  const [activeTab, setActiveTab] = useState('weekly') // 'weekly', 'monthly', 'longterm'
  const [goals, setGoals] = useState({ weekly: [], monthly: [], longterm: [] })
  const [newGoal, setNewGoal] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [loading, setLoading] = useState(true)
  useAppBackHandler(() => {
    onClose()
    return true
  }, true, 10)

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      const data = await storage.getAll()
      const savedGoals = data.goals || { weekly: [], monthly: [], longterm: [] }
      setGoals(savedGoals)
    } catch (error) {
      console.error('Error loading goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveGoals = async (updatedGoals) => {
    try {
      const data = await storage.getAll()
      data.goals = updatedGoals
      await storage.saveAll(data)
      emit(EVENTS.STUDY_TARGETS_UPDATED, { goals: updatedGoals })
    } catch (error) {
      console.error('Error saving goals:', error)
    }
  }

  const addGoal = () => {
    if (!newGoal.trim()) return

    const updatedGoals = { ...goals }
    const goal = {
      id: Date.now(),
      text: newGoal,
      completed: false,
      createdDate: new Date().toISOString(),
      completedDate: null
    }

    updatedGoals[activeTab].push(goal)
    setGoals(updatedGoals)
    saveGoals(updatedGoals)
    setNewGoal('')
  }

  const toggleGoal = (goalId) => {
    const updatedGoals = { ...goals }
    const goal = updatedGoals[activeTab].find(g => g.id === goalId)
    if (goal) {
      goal.completed = !goal.completed
      goal.completedDate = goal.completed ? new Date().toISOString() : null
      setGoals(updatedGoals)
      saveGoals(updatedGoals)
    }
  }

  const deleteGoal = (goalId) => {
    const updatedGoals = { ...goals }
    updatedGoals[activeTab] = updatedGoals[activeTab].filter(g => g.id !== goalId)
    setGoals(updatedGoals)
    saveGoals(updatedGoals)
  }

  const updateGoal = (goalId, newText) => {
    const updatedGoals = { ...goals }
    const goal = updatedGoals[activeTab].find(g => g.id === goalId)
    if (goal) {
      goal.text = newText
      setGoals(updatedGoals)
      saveGoals(updatedGoals)
    }
    setEditingId(null)
    setEditingText('')
  }

  const completedCount = goals[activeTab].filter(g => g.completed).length
  const totalCount = goals[activeTab].length
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const getTabIcon = (tab) => {
    switch (tab) {
      case 'weekly':
        return '📅'
      case 'monthly':
        return '📊'
      case 'longterm':
        return '🎯'
      default:
        return '📋'
    }
  }

  const getTabLabel = (tab) => {
    switch (tab) {
      case 'weekly':
        return 'Weekly Goals'
      case 'monthly':
        return 'Monthly Goals'
      case 'longterm':
        return 'Long-term Goals'
      default:
        return 'Goals'
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-2 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-none sm:rounded-xl shadow-2xl w-full h-dvh md:h-auto md:max-h-[90vh] md:max-w-3xl modal-enter border border-blue-200 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-xl flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="hidden sm:inline">Goals Tracker</span>
            <span className="sm:hidden">Goals</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white text-3xl font-bold flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {/* Tab Navigation */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
            {['weekly', 'monthly', 'longterm'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-2 sm:px-4 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="block sm:hidden text-lg">{getTabIcon(tab)}</span>
                <span className="hidden sm:block">{getTabIcon(tab)} {getTabLabel(tab)}</span>
              </button>
            ))}
          </div>

          {/* Progress Bar */}
          {totalCount > 0 && (
            <div className="mb-6 bg-slate-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm sm:text-base font-semibold text-slate-700">
                  {getTabLabel(activeTab)} Progress
                </h3>
                <span className="text-sm sm:text-base font-bold text-blue-600">
                  {completedCount}/{totalCount}
                </span>
              </div>
              <div className="w-full h-2 sm:h-3 bg-white rounded-full overflow-hidden border border-blue-200">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <div className="text-right mt-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-600">
                  {completionPercentage}% Complete
                </span>
              </div>
            </div>
          )}

          {/* Add Goal Form */}
          <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Add New {getTabLabel(activeTab)}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                placeholder={`e.g., Complete ${activeTab === 'weekly' ? '50 Polity questions' : activeTab === 'monthly' ? 'All Misfits episodes' : 'UPSC Exam'}`}
                className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={addGoal}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md text-sm"
              >
                Add
              </button>
            </div>
          </div>

          {/* Goals List */}
          <div className="space-y-2">
            {goals[activeTab].length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-slate-500">
                <p className="text-2xl sm:text-3xl mb-2">🎯</p>
                <p className="text-base sm:text-lg font-medium">No {activeTab} goals yet</p>
                <p className="text-xs sm:text-sm mt-1">Add your first goal above!</p>
              </div>
            ) : (
              goals[activeTab].map(goal => (
                <div
                  key={goal.id}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all group ${
                    goal.completed
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-white border-blue-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleGoal(goal.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all mt-0.5 ${
                        goal.completed
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-blue-400 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                    >
                      {goal.completed && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* Goal Text */}
                    <div className="flex-1 min-w-0">
                      {editingId === goal.id ? (
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={() => updateGoal(goal.id, editingText)}
                          onKeyPress={(e) => e.key === 'Enter' && updateGoal(goal.id, editingText)}
                          autoFocus
                          className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      ) : (
                        <p className={`text-sm sm:text-base font-medium ${
                          goal.completed
                            ? 'text-slate-500 line-through'
                            : 'text-slate-700'
                        }`}>
                          {goal.text}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingId(goal.id)
                          setEditingText(goal.text)
                        }}
                        className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-3 sm:p-6 border-t bg-gradient-to-r from-blue-50 to-indigo-50 rounded-b-xl flex justify-center">
          <button 
            onClick={onClose}
            className="px-6 sm:px-8 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default GoalsTracker
