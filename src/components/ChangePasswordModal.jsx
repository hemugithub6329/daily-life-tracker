import { useEffect, useState } from 'react'
import PasswordPromptModal from './PasswordPromptModal.jsx'
import { useAppBackHandler } from '../utils/backNavigation.js'

function ChangePasswordModal({
  isOpen,
  onClose,
  onChangePassword,
  currentHint,
  onDeletePassword,
  recoveryPatternHash = '',
  onPatternSubmit,
  onRecoverPassword
}) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newHint, setNewHint] = useState(currentHint || '')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false)
  useEffect(() => {
    if (isOpen) setNewHint(currentHint || '')
  }, [currentHint, isOpen])
  useAppBackHandler(() => {
    if (showRecoveryPrompt) {
      setShowRecoveryPrompt(false)
      return true
    }
    onClose()
    return true
  }, isOpen, 30)

  const handleRecoveryPassword = async (newPassword) => {
    const result = await onRecoverPassword(newPassword)
    if (result.success) {
      setShowRecoveryPrompt(false)
      onClose()
    }
    return result
  }

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!oldPassword.trim()) {
      setError('Please enter your old password')
      return
    }
    
    if (!newPassword.trim()) {
      setError('Please enter a new password')
      return
    }
    
    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    
    setIsSaving(true)
    setError('')
    
    try {
      const result = await onChangePassword(oldPassword, newPassword, newHint)
      
      if (result.success) {
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setNewHint('')
        setIsSaving(false)
        onClose()
      } else {
        setError(result.error || 'Failed to change password')
        setIsSaving(false)
      }
    } catch (err) {
      setError('Failed to change password. Please try again.')
      setIsSaving(false)
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
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Change Master Password</h3>
            <p className="text-sm text-slate-500">
              Enter your old password and set a new one. This will update the password for all locked notes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Old Password *
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value)
                  setError('')
                }}
                placeholder="Enter your current password"
                className="input-field"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Password *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setError('')
                }}
                placeholder="Enter a new password (min 4 characters)"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm New Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setError('')
                }}
                placeholder="Re-enter your new password"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password Hint (optional)
              </label>
              <input
                type="text"
                value={newHint}
                onChange={(e) => setNewHint(e.target.value)}
                placeholder="e.g., My birthday"
                className="input-field"
              />
              <p className="text-xs text-slate-400 mt-1">
                This will help you remember your password if you forget it
              </p>
            </div>

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
                disabled={isSaving}
              >
                Cancel
              </button>
              {onDeletePassword && (
                <button
                  type="button"
                  onClick={onDeletePassword}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSaving}
                >
                  Delete Password
                </button>
              )}
              <button
                type="submit"
                className="flex-1 btn-primary"
                disabled={isSaving}
              >
                {isSaving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
          {recoveryPatternHash && onPatternSubmit && onRecoverPassword && (
            <button
              type="button"
              onClick={() => setShowRecoveryPrompt(true)}
              className="mt-4 w-full text-center text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Forgot password? Use recovery pattern
            </button>
          )}
        </div>
      </div>
      <PasswordPromptModal
        isOpen={showRecoveryPrompt}
        onClose={() => setShowRecoveryPrompt(false)}
        onPasswordSubmit={async () => ({ success: false })}
        onPatternSubmit={onPatternSubmit}
        onRecoverPassword={handleRecoveryPassword}
        recoveryPatternHash={recoveryPatternHash}
        initialMode="pattern"
        title="Reset master password"
      />
    </div>
  )
}

export default ChangePasswordModal