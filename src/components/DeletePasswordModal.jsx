import { useState } from 'react'
import { useAppBackHandler } from '../utils/backNavigation.js'

function DeletePasswordModal({ isOpen, onClose, onDeletePassword, requirePassword = true }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  useAppBackHandler(() => {
    onClose()
    return true
  }, isOpen, 40)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (requirePassword && !currentPassword.trim()) {
      setError('Please enter your current password')
      return
    }
    
    setIsDeleting(true)
    setError('')
    
    try {
      const result = await onDeletePassword(currentPassword)
      
      if (result.success) {
        setCurrentPassword('')
        setIsDeleting(false)
        onClose()
      } else {
        setError(result.error || 'Failed to delete password')
        setIsDeleting(false)
      }
    } catch (err) {
      setError('Failed to delete password. Please try again.')
      setIsDeleting(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4 animate-fade-in safe-area-top safe-area-bottom"
      onClick={handleBackdropClick}
    >
      <div className="glass-card border border-slate-100 max-w-md w-full h-dvh max-h-dvh sm:h-auto sm:max-h-[90vh] flex flex-col modal-enter overflow-hidden sm:my-4 rounded-none sm:rounded-xl">
        <div className="p-6 overflow-y-auto flex-1">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Master Password</h3>
            <p className="text-sm text-slate-500">
              This will remove the password protection from ALL locked notes. Are you sure?
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {requirePassword && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Current Password *
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter your current password"
                  className="input-field"
                  autoFocus
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default DeletePasswordModal