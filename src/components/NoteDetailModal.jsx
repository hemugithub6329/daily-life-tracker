import { useState, useEffect } from 'react'
import storage from '../utils/fileStorage.js'
import { formatDisplayDate } from '../utils/dateUtils.js'
import { emit, EVENTS, NOTES_UPDATED } from '../utils/events.js'
import { verifyPassword, hashPassword } from '../utils/passwordUtils.js'
import PasswordPromptModal from './PasswordPromptModal.jsx'
import PasswordSetupModal from './PasswordSetupModal.jsx'
import ChangePasswordModal from './ChangePasswordModal.jsx'
import DeletePasswordModal from './DeletePasswordModal.jsx'
import { useAppBackHandler } from '../utils/backNavigation.js'

function NoteDetailModal({ date, onClose }) {
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [isGloballyLocked, setIsGloballyLocked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Master password state
  const [masterPasswordHash, setMasterPasswordHash] = useState('')
  const [masterPasswordHint, setMasterPasswordHint] = useState('')
  const [recoveryPatternHash, setRecoveryPatternHash] = useState('')
  
  // Modals
  const [showPasswordSetup, setShowPasswordSetup] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showDeletePassword, setShowDeletePassword] = useState(false)

  const handleBack = () => {
    if (showDeletePassword) setShowDeletePassword(false)
    else if (showChangePassword) setShowChangePassword(false)
    else if (showPasswordSetup) setShowPasswordSetup(false)
    else onClose()
    return true
  }
  useAppBackHandler(handleBack, Boolean(date), 20)

  useEffect(() => {
    if (date) {
      loadNoteMetadata()
    }
  }, [date])

  // Listen for undo/redo state restoration
  useEffect(() => {
    const handleStateRestored = () => {
      if (date) {
        loadNoteMetadata()
      }
    }
    window.addEventListener('state-restored', handleStateRestored)
    return () => window.removeEventListener('state-restored', handleStateRestored)
  }, [date])

  const loadNoteMetadata = async () => {
    const metadata = await storage.getNotesMetadata(date)
    const masterPassword = await storage.getMasterPassword()
    
    setNote(metadata.notes)
    setIsLocked(metadata.isLocked)
    setIsGloballyLocked(metadata.isGloballyLocked)
    setMasterPasswordHash(masterPassword.hash)
    setMasterPasswordHint(masterPassword.hint)
    setRecoveryPatternHash(masterPassword.recoveryPatternHash)
    
    // If note is locked and master password exists, show password prompt
    if (metadata.isLocked && masterPassword.hash) {
      setShowPasswordPrompt(true)
      setIsAuthenticated(false)
    } else {
      setIsAuthenticated(true)
    }
  }

  const loadNote = async () => {
    const savedNote = await storage.getNotes(date)
    setNote(savedNote)
  }

  const handleSave = async () => {
    // If note is being saved as empty and it's locked, unlock it
    if ((!note || note.trim().length === 0) && isLocked) {
      await storage.setNoteLocked(date, false)
      setIsLocked(false)
    }
    
    setIsSaving(true)
    await storage.saveNotes(date, note)
    emit(NOTES_UPDATED, { date, note })
    setIsSaving(false)
    onClose()
  }

  const handlePasswordSubmit = async (password) => {
    const isValid = await verifyPassword(password, masterPasswordHash)
    if (isValid) {
      setIsAuthenticated(true)
      setShowPasswordPrompt(false)
      return { success: true }
    }
    return { success: false, error: 'Incorrect password' }
  }

  const handleProtectNote = async () => {
    // Check if note has content
    if (!note || note.trim().length === 0) {
      alert('Please write some content in the note before locking it.')
      return
    }
    
    const masterPassword = await storage.getMasterPassword()
    
    if (!masterPassword.hash) {
      // No master password exists, show setup modal
      setShowPasswordSetup(true)
    } else {
      // Master password exists, just lock the note
      await storage.saveNotes(date, note)
      const success = await storage.setNoteLocked(date, true)
      if (success) {
        setIsLocked(true)
        emit(NOTES_UPDATED, { date, note })
      } else {
        alert('Cannot lock an empty note.')
      }
    }
  }

  const handlePasswordSet = async (newPasswordHash, newHint, newRecoveryPatternHash) => {
    await storage.setMasterPassword(newPasswordHash, newHint, newRecoveryPatternHash)
    setMasterPasswordHash(newPasswordHash)
    setMasterPasswordHint(newHint)
    setRecoveryPatternHash(newRecoveryPatternHash)
    setIsGloballyLocked(true)
    emit(EVENTS.MASTER_PASSWORD_UPDATED)
    // Also lock the current note (only if it has content)
    if (note && note.trim().length > 0) {
      await storage.saveNotes(date, note)
      const locked = await storage.setNoteLocked(date, true)
      if (!locked) throw new Error('Could not lock the current note.')
      setIsLocked(true)
      emit(NOTES_UPDATED, { date, note })
    }
  }

  const handlePatternSubmit = async (pattern) => {
    const isValid = await verifyPassword(pattern.join(','), recoveryPatternHash)
    return isValid
      ? { success: true }
      : { success: false, error: 'The recovery pattern is incorrect' }
  }

  const handleRecoverPassword = async (newPassword) => {
    try {
      const newPasswordHash = await hashPassword(newPassword)
      await storage.updateMasterPassword(newPasswordHash, masterPasswordHint)
      await storage.setNoteLocked(date, false)
      setMasterPasswordHash(newPasswordHash)
      setIsLocked(false)
      setIsAuthenticated(true)
      setShowPasswordPrompt(false)
      emit(EVENTS.MASTER_PASSWORD_UPDATED)
      return { success: true }
    } catch (error) {
      console.error('Could not reset the master password:', error)
      return { success: false, error: 'Could not reset the master password. Please try again.' }
    }
  }

  const handleUnlockNote = async () => {
    await storage.setNoteLocked(date, false)
    setIsLocked(false)
  }

  const handleChangePassword = async (oldPassword, newPassword, newHint) => {
    const isOldPasswordValid = await verifyPassword(oldPassword, masterPasswordHash)
    if (!isOldPasswordValid) {
      return { success: false, error: 'Old password is incorrect' }
    }
    
    const newPasswordHash = await hashPassword(newPassword)
    await storage.updateMasterPassword(newPasswordHash, newHint)
    setMasterPasswordHash(newPasswordHash)
    setMasterPasswordHint(newHint)
    emit(EVENTS.MASTER_PASSWORD_UPDATED)
    return { success: true }
  }

  const handleDeletePassword = async (currentPassword) => {
    if (currentPassword) {
      const isValid = await verifyPassword(currentPassword, masterPasswordHash)
      if (!isValid) {
        return { success: false, error: 'Incorrect password' }
      }
    }
    
    await storage.deleteMasterPassword()
    setMasterPasswordHash('')
    setMasterPasswordHint('')
    setRecoveryPatternHash('')
    setIsGloballyLocked(false)
    setIsLocked(false)
    emit(EVENTS.MASTER_PASSWORD_UPDATED)
    return { success: true }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!date) return null

  // Show password prompt if note is locked and not authenticated
  if (isLocked && !isAuthenticated && isGloballyLocked) {
    return (
      <>
        <PasswordPromptModal
          isOpen={showPasswordPrompt}
          onClose={() => {
            setShowPasswordPrompt(false)
            onClose()
          }}
          onPasswordSubmit={handlePasswordSubmit}
          onPatternSubmit={handlePatternSubmit}
          onRecoverPassword={handleRecoverPassword}
          title="This note is locked"
          hint={masterPasswordHint}
          recoveryPatternHash={recoveryPatternHash}
        />
      </>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4 animate-fade-in safe-area-top safe-area-bottom"
      onClick={handleBackdropClick}
    >
      <div className="glass-card border border-slate-100 max-w-lg w-full h-dvh max-h-dvh sm:h-auto sm:max-h-[80vh] flex flex-col modal-enter overflow-hidden sm:my-8 rounded-none sm:rounded-xl">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-500 sm:rounded-t-xl">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Notes for {formatDisplayDate(new Date(date))}
            {isLocked && (
              <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Locked
              </span>
            )}
          </h3>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Protect/Unlock button */}
            <button
              onClick={isLocked ? handleUnlockNote : handleProtectNote}
              className="text-white/80 hover:text-white p-2 sm:p-1 rounded hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
              title={isLocked ? "Unlock note" : "Protect note"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isLocked ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                )}
              </svg>
            </button>
            
            {/* Change master password button */}
            {isGloballyLocked && (
              <button
                onClick={() => setShowChangePassword(true)}
                className="text-white/80 hover:text-white p-2 sm:p-1 rounded hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                title="Change master password"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </button>
            )}
            
            {/* Delete master password button */}
            {isGloballyLocked && (
              <button
                onClick={() => setShowDeletePassword(true)}
                className="text-white/80 hover:text-white p-2 sm:p-1 rounded hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                title="Delete master password"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-5 flex-1">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your notes here..."
            className="input-field h-48 resize-none"
          />
        </div>
        
        <div className="p-5 border-t flex flex-col sm:flex-row gap-2 justify-between">
          <button 
            onClick={onClose}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Calendar
          </button>
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Password Setup Modal */}
      <PasswordSetupModal
        isOpen={showPasswordSetup}
        onClose={() => setShowPasswordSetup(false)}
        onPasswordSet={handlePasswordSet}
      />
      
      {/* Password Prompt Modal */}
      <PasswordPromptModal
        isOpen={showPasswordPrompt}
        onClose={() => {
          setShowPasswordPrompt(false)
          onClose()
        }}
        onPasswordSubmit={handlePasswordSubmit}
        onPatternSubmit={handlePatternSubmit}
        onRecoverPassword={handleRecoverPassword}
        title="This note is locked"
        hint={masterPasswordHint}
        recoveryPatternHash={recoveryPatternHash}
      />
      
      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onChangePassword={handleChangePassword}
        currentHint={masterPasswordHint}
        onDeletePassword={() => setShowDeletePassword(true)}
        recoveryPatternHash={recoveryPatternHash}
        onPatternSubmit={handlePatternSubmit}
        onRecoverPassword={handleRecoverPassword}
      />
      
      {/* Delete Password Modal */}
      <DeletePasswordModal
        isOpen={showDeletePassword}
        onClose={() => setShowDeletePassword(false)}
        onDeletePassword={handleDeletePassword}
        requirePassword={true}
      />
    </div>
  )
}

export default NoteDetailModal