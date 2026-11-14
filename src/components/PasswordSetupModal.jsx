import { useState } from 'react'
import { hashPassword } from '../utils/passwordUtils.js'
import PatternLock from './PatternLock.jsx'
import { useAppBackHandler } from '../utils/backNavigation.js'

function PasswordSetupModal({ isOpen, onClose, onPasswordSet }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [hint, setHint] = useState('')
  const [recoveryPattern, setRecoveryPattern] = useState([])
  const [confirmRecoveryPattern, setConfirmRecoveryPattern] = useState([])
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  useAppBackHandler(() => {
    onClose()
    return true
  }, isOpen, 35)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError('Please enter a password')
      return
    }
    
    if (password.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (recoveryPattern.length < 4) {
      setError('Draw a recovery pattern using at least 4 dots')
      return
    }

    if (recoveryPattern.join(',') !== confirmRecoveryPattern.join(',')) {
      setError('Recovery patterns do not match')
      return
    }
    
    setIsSaving(true)
    setError('')
    
    try {
      const passwordHash = await hashPassword(password)
      const recoveryPatternHash = await hashPassword(recoveryPattern.join(','))
      await onPasswordSet(passwordHash, hint, recoveryPatternHash)
      setPassword('')
      setConfirmPassword('')
      setHint('')
      setRecoveryPattern([])
      setConfirmRecoveryPattern([])
      setIsSaving(false)
      onClose()
    } catch (err) {
      setError('Failed to set password. Please try again.')
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
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Set Master Password</h3>
            <p className="text-sm text-slate-500">
              This password will be used for all locked notes. You only need to set it once.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="Enter a password (min 4 characters)"
                className="input-field"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setError('')
                }}
                placeholder="Re-enter your password"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password Hint (optional)
              </label>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="e.g., My birthday"
                className="input-field"
              />
              <p className="text-xs text-slate-400 mt-1">
                This will help you remember your password if you forget it
              </p>
            </div>

            <div className="space-y-2 border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-700">Set a recovery pattern</p>
              <p className="text-xs text-slate-500">If you forget your password, this pattern lets you reset it. Use at least 4 dots.</p>
              <PatternLock value={recoveryPattern} onChange={setRecoveryPattern} label="Draw recovery pattern" />
              <button type="button" onClick={() => setRecoveryPattern([])} className="text-sm font-medium text-indigo-600">Clear pattern</button>
              <p className="pt-2 text-sm font-semibold text-slate-700">Confirm recovery pattern</p>
              <PatternLock value={confirmRecoveryPattern} onChange={setConfirmRecoveryPattern} label="Confirm recovery pattern" />
              <button type="button" onClick={() => setConfirmRecoveryPattern([])} className="text-sm font-medium text-indigo-600">Clear confirmation</button>
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
              <button
                type="submit"
                className="flex-1 btn-primary"
                disabled={isSaving}
              >
                {isSaving ? 'Setting...' : 'Set Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PasswordSetupModal