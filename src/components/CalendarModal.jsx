import { useState } from 'react'
import CalendarView from './CalendarView.jsx'

function CalendarModal({ fixedHabits, selectedDate, onDateChange, onClose }) {
  const handleDateSelect = (date) => {
    onDateChange(date)
    // Optionally close after selection - user can also close manually
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 overflow-y-auto animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="min-h-screen p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl mx-auto modal-enter">
          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-xl flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Habit Calendar Navigator
            </h2>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white text-3xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Calendar Content */}
          <div className="p-6">
            <CalendarView 
              fixedHabits={fixedHabits}
              selectedDate={selectedDate}
              onDateChange={handleDateSelect}
            />
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-center gap-4">
            <button 
              onClick={onClose}
              className="px-8 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarModal
