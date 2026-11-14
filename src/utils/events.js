// Event names constants
export const EVENTS = {
  HABITS_UPDATED: 'habitsUpdated',
  NOTES_UPDATED: 'notesUpdated',
  MASTER_PASSWORD_UPDATED: 'masterPasswordUpdated',
  QUOTES_UPDATED: 'quotesUpdated',
  QUOTE_CHANGED: 'quoteChanged',
  MISFITS_UPDATED: 'misfitsUpdated',
  COUNTDOWN_UPDATED: 'countdownUpdated',
  STUDY_TARGETS_UPDATED: 'studyTargetsUpdated',
  STUDY_SESSIONS_UPDATED: 'studySessionsUpdated',
  HOME_TASKS_UPDATED: 'homeTasksUpdated'
}

// Legacy exports for backward compatibility
export const HABITS_UPDATED = EVENTS.HABITS_UPDATED
export const NOTES_UPDATED = EVENTS.NOTES_UPDATED
export const MASTER_PASSWORD_UPDATED = EVENTS.MASTER_PASSWORD_UPDATED
export const QUOTES_UPDATED = EVENTS.QUOTES_UPDATED
export const QUOTE_CHANGED = EVENTS.QUOTE_CHANGED
export const MISFITS_UPDATED = EVENTS.MISFITS_UPDATED
export const COUNTDOWN_UPDATED = EVENTS.COUNTDOWN_UPDATED
export const STUDY_TARGETS_UPDATED = EVENTS.STUDY_TARGETS_UPDATED
export const STUDY_SESSIONS_UPDATED = EVENTS.STUDY_SESSIONS_UPDATED
export const HOME_TASKS_UPDATED = EVENTS.HOME_TASKS_UPDATED

// Event bus using CustomEvents for cross-component communication
const eventBus = {
  listeners: new Map(),
  
  on(event, callback) {
    let eventListeners = this.listeners.get(event)
    if (!eventListeners) {
      eventListeners = new Map()
      this.listeners.set(event, eventListeners)
    }

    const domHandler = (e) => callback(e.detail)
    let handlers = eventListeners.get(callback)
    if (!handlers) {
      handlers = new Set()
      eventListeners.set(callback, handlers)
    }
    handlers.add(domHandler)
    window.addEventListener(event, domHandler)
    
    return () => {
      this.off(event, callback, domHandler)
    }
  },
  
  off(event, callback, domHandler) {
    const eventListeners = this.listeners.get(event)
    const handlers = eventListeners?.get(callback)
    if (!handlers) return

    const handlersToRemove = domHandler ? [domHandler] : [...handlers]
    handlersToRemove.forEach(handler => {
      window.removeEventListener(event, handler)
      handlers.delete(handler)
    })

    if (handlers.size === 0) {
      eventListeners.delete(callback)
    }
    if (eventListeners.size === 0) {
      this.listeners.delete(event)
    }
  },
  
  emit(event, data = null) {
    window.dispatchEvent(new CustomEvent(event, { detail: data }))
  }
}

// Export individual methods
export const on = (event, callback) => eventBus.on(event, callback)
export const off = (event, callback) => eventBus.off(event, callback)
export const emit = (event, data) => eventBus.emit(event, data)

// App events object (alternative API)
export const appEvents = {
  on: (event, callback) => eventBus.on(event, callback),
  off: (event, callback) => eventBus.off(event, callback),
  emit: (event, data) => eventBus.emit(event, data)
}

export default eventBus
