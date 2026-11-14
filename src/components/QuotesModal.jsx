import { useState } from 'react'
import storage from '../utils/fileStorage.js'
import { emit, QUOTES_UPDATED } from '../utils/events.js'
import { useAppBackHandler } from '../utils/backNavigation.js'

function QuotesModal({ quotes, onClose, onQuotesChange }) {
  const [newQuote, setNewQuote] = useState('')
  const [editingIndex, setEditingIndex] = useState(null)
  const [editText, setEditText] = useState('')
  useAppBackHandler(() => {
    onClose()
    return true
  }, true, 10)

  const handleAddQuote = async () => {
    if (!newQuote.trim()) return
    
    const updatedQuotes = [...quotes, newQuote.trim()]
    await storage.saveQuotes(updatedQuotes)
    onQuotesChange(updatedQuotes)
    setNewQuote('')
    emit(QUOTES_UPDATED, updatedQuotes)
  }

  const handleDeleteQuote = async (index) => {
    const updatedQuotes = quotes.filter((_, i) => i !== index)
    await storage.saveQuotes(updatedQuotes)
    onQuotesChange(updatedQuotes)
    emit(QUOTES_UPDATED, updatedQuotes)
  }

  const handleStartEdit = (index) => {
    setEditingIndex(index)
    setEditText(quotes[index])
  }

  const handleSaveEdit = async () => {
    if (!editText.trim()) return
    
    const updatedQuotes = quotes.map((q, i) => i === editingIndex ? editText.trim() : q)
    await storage.saveQuotes(updatedQuotes)
    onQuotesChange(updatedQuotes)
    setEditingIndex(null)
    setEditText('')
    emit(QUOTES_UPDATED, updatedQuotes)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 overflow-y-auto animate-fade-in safe-area-top safe-area-bottom"
      onClick={handleBackdropClick}
    >
      <div className="min-h-dvh p-0 sm:min-h-0 sm:p-4 pb-safe">
        <div className="bg-white rounded-none sm:rounded-xl shadow-2xl w-full min-h-dvh sm:min-h-0 max-w-2xl mx-auto modal-enter max-h-dvh sm:max-h-[80vh] flex flex-col border border-blue-200 sm:my-8">
          <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-xl">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Quotes Manager
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          <div className="p-4 space-y-4 overflow-hidden flex flex-col">
            {/* Add Quote */}
            <div className="flex gap-2 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
              <textarea
                placeholder="Add new quote..."
                value={newQuote}
                onChange={(e) => setNewQuote(e.target.value)}
                className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20 text-slate-700"
              />
              <button
                onClick={handleAddQuote}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md self-start"
              >
                Add
              </button>
            </div>

            {/* Quotes List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 max-h-64">
              {quotes.map((quote, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 rounded-lg border-2 border-blue-200 bg-white group"
                >
                  {editingIndex === index ? (
                    <>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm resize-none h-16 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={handleSaveEdit}
                          className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-slate-700 text-sm font-medium">"{quote}"</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStartEdit(index)}
                          className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteQuote(index)}
                          className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuotesModal
