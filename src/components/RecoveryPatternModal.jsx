import { useState } from 'react'
import PatternLock from './PatternLock.jsx'
import { hashPassword, verifyPassword } from '../utils/passwordUtils.js'
import { useAppBackHandler } from '../utils/backNavigation.js'

function RecoveryPatternModal({ isOpen, onClose, masterPasswordHash, onSave }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [pattern, setPattern] = useState([])
  const [confirmation, setConfirmation] = useState([])
  const [step, setStep] = useState('password')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('draw')
      setPattern([])
      setConfirmation([])
      setError('')
    } else {
      onClose()
    }
    return true
  }
  useAppBackHandler(handleBack, isOpen, 40)

  if (!isOpen) return null

  const verifyCurrentPassword = async (event) => {
    event.preventDefault()
    if (!await verifyPassword(currentPassword, masterPasswordHash)) {
      setError('The current master password is incorrect.')
      return
    }
    setError('')
    setStep('draw')
  }

  const handleDrawContinue = () => {
    if (pattern.length < 4) {
      setError('Connect at least 4 dots for your pattern.')
      return
    }
    setError('')
    setStep('confirm')
  }

  const handleSavePattern = async () => {
    if (confirmation.length < 4 || pattern.join(',') !== confirmation.join(',')) {
      setError('The patterns do not match. Draw the same pattern again.')
      setConfirmation([])
      return
    }
    setIsSaving(true)
    setError('')
    try {
      await onSave(await hashPassword(pattern.join(',')))
      onClose()
    } catch (saveError) {
      console.error('Could not save recovery pattern:', saveError)
      setError('Could not save your recovery pattern. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-0 sm:p-4" onClick={event => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby="recovery-pattern-title" className="flex h-dvh w-full flex-col overflow-y-auto bg-white p-5 sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl sm:p-6">
        <h2 id="recovery-pattern-title" className="text-xl font-bold text-slate-800">Recovery pattern</h2>
        <p className="mt-2 text-sm text-slate-600">
          {step === 'password'
            ? 'Confirm your master password before setting a recovery pattern.'
            : step === 'draw'
              ? 'Draw a pattern using at least four dots. You can use it to reset your forgotten master password.'
              : 'Draw the same pattern again to confirm it.'}
        </p>

        {step === 'password' ? (
          <form onSubmit={verifyCurrentPassword} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Current master password
              <input autoFocus type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="input-field mt-2" required />
            </label>
            <button type="submit" className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700">Continue</button>
          </form>
        ) : (
          <div className="mt-4">
            <PatternLock
              value={step === 'draw' ? pattern : confirmation}
              onChange={step === 'draw' ? setPattern : setConfirmation}
              label={step === 'draw' ? 'Draw your new recovery pattern' : 'Confirm your recovery pattern'}
            />
            <button
              type="button"
              onClick={() => step === 'draw' ? handleDrawContinue() : handleSavePattern()}
              disabled={isSaving}
              className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : step === 'draw' ? 'Continue' : 'Save recovery pattern'}
            </button>
          </div>
        )}

        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="button" onClick={onClose} className="mt-auto pt-5 text-sm font-semibold text-slate-500">Cancel</button>
      </section>
    </div>
  )
}

export default RecoveryPatternModal
