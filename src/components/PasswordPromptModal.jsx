import { useState } from 'react'
import PatternLock from './PatternLock.jsx'
import { useAppBackHandler } from '../utils/backNavigation.js'

function PasswordPromptModal({ 
  isOpen, 
  onClose, 
  onPasswordSubmit, 
  onPatternSubmit,
  onRecoverPassword,
  title = "Enter Password",
  hint = "",
  recoveryPatternHash = '',
  initialMode = 'password',
  showPassword = false,
  changePasswordMode = false
}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pattern, setPattern] = useState([])
  const [mode, setMode] = useState(initialMode)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleBack = () => {
    if (mode === 'reset') {
      setMode('pattern')
      setPassword('')
      setConfirmPassword('')
      setError('')
    } else if (mode === 'pattern' && initialMode === 'pattern') {
      onClose()
    } else if (mode === 'pattern') {
      setMode('password')
      setPattern([])
      setError('')
    } else {
      onClose()
    }
    return true
  }
  useAppBackHandler(handleBack, isOpen, 50)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (mode === 'reset') {
      if (password.length < 4) {
        setError('New password must be at least 4 characters')
        return
      }
      if (password !== confirmPassword) {
        setError('The passwords do not match')
        return
      }
      setIsLoading(true)
      try {
        const result = await onRecoverPassword(password)
        if (result.success) {
          setPassword('')
          setConfirmPassword('')
          setMode('password')
        } else {
          setError(result.error || 'Could not reset the password')
        }
      } catch (submitError) {
        console.error('Password recovery failed:', submitError)
        setError('Could not reset the password. Please try again.')
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (!password.trim()) {
      setError('Please enter a password')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const result = await onPasswordSubmit(password)
      if (result.success) {
        setPassword('')
      } else {
        setError(result.error || 'Incorrect password')
      }
    } catch (submitError) {
      console.error('Password verification failed:', submitError)
      setError('Could not verify the password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePatternSubmit = async () => {
    if (pattern.length < 4) {
      setError('Draw your recovery pattern using at least 4 dots')
      return
    }
    setIsLoading(true)
    try {
      const result = await onPatternSubmit(pattern)
      if (result.success) {
        setMode('reset')
        setPattern([])
        setError('')
      } else {
        setError(result.error || 'The recovery pattern is incorrect')
      }
    } catch (submitError) {
      console.error('Recovery pattern verification failed:', submitError)
      setError('Could not verify the recovery pattern. Please try again.')
    } finally {
      setIsLoading(false)
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
            {hint && (
              <p className="text-sm text-slate-500 bg-slate-50 p-2 rounded-lg">
                <span className="font-medium">Hint:</span> {hint}
              </p>
            )}
          </div>

          {mode === 'pattern' ? (
            <div className="space-y-4">
              <PatternLock value={pattern} onChange={setPattern} label="Enter your recovery pattern" />
              {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
              <button type="button" onClick={handlePatternSubmit} disabled={isLoading} className="w-full btn-primary disabled:opacity-50">
                {isLoading ? 'Checking...' : 'Verify pattern'}
              </button>
                <button type="button" onClick={handleBack} className="w-full btn-secondary" disabled={isLoading}>
                  Back
                </button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {mode === 'reset' ? 'New Master Password' : changePasswordMode ? 'New Password' : 'Password'}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder={mode === 'reset' ? 'Enter a new password' : 'Enter your password'}
                className="input-field"
                autoFocus
              />
            </div>

            {mode === 'reset' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm new password</label>
                <input type="password" value={confirmPassword} onChange={event => {
                  setConfirmPassword(event.target.value)
                  setError('')
                }} className="input-field" autoComplete="new-password" />
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
                onClick={mode === 'reset' ? () => setMode('pattern') : onClose}
                className="flex-1 btn-secondary"
                disabled={isLoading}
              >
                {mode === 'reset' ? 'Back' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : mode === 'reset' ? 'Reset password' : 'Submit'}
              </button>
            </div>
            {mode === 'password' && recoveryPatternHash && onPatternSubmit && (
              <button type="button" onClick={() => {
                setMode('pattern')
                setError('')
              }} className="w-full text-center text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                Forgot password? Use recovery pattern
              </button>
            )}
          </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default PasswordPromptModal