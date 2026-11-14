// History Manager for Undo/Redo functionality
// Stores state changes in memory (lost on page reload)

const MAX_HISTORY_SIZE = 50

class HistoryManager {
  constructor() {
    this.undoStack = []
    this.redoStack = []
    this.currentState = null
  }

  // Save a new state to history
  saveState(state, description = 'Action') {
    // Don't save if state is identical to current
    if (this.currentState && JSON.stringify(state) === JSON.stringify(this.currentState)) {
      return
    }

    // Push current state to undo stack before updating
    if (this.currentState) {
      this.undoStack.push({
        state: JSON.parse(JSON.stringify(this.currentState)),
        description: this.currentState._description || 'Previous state'
      })

      // Limit undo stack size
      if (this.undoStack.length > MAX_HISTORY_SIZE) {
        this.undoStack.shift()
      }
    }

    // Clear redo stack when new action is performed
    this.redoStack = []

    // Update current state
    this.currentState = {
      ...JSON.parse(JSON.stringify(state)),
      _description: description,
      _timestamp: Date.now()
    }
  }

  // Check if undo is available
  canUndo() {
    return this.undoStack.length > 0
  }

  // Check if redo is available
  canRedo() {
    return this.redoStack.length > 0
  }

  // Undo last action
  undo() {
    if (!this.canUndo()) return null

    // Push current state to redo stack
    if (this.currentState) {
      this.redoStack.push({
        state: JSON.parse(JSON.stringify(this.currentState)),
        description: this.currentState._description
      })
    }

    // Pop from undo stack and set as current
    const previous = this.undoStack.pop()
    this.currentState = previous.state

    return previous.state
  }

  // Redo last undone action
  redo() {
    if (!this.canRedo()) return null

    // Push current state to undo stack
    if (this.currentState) {
      this.undoStack.push({
        state: JSON.parse(JSON.stringify(this.currentState)),
        description: this.currentState._description
      })
    }

    // Pop from redo stack and set as current
    const next = this.redoStack.pop()
    this.currentState = next.state

    return next.state
  }

  // Get current state
  getCurrentState() {
    return this.currentState ? JSON.parse(JSON.stringify(this.currentState)) : null
  }

  // Clear all history
  clear() {
    this.undoStack = []
    this.redoStack = []
    this.currentState = null
  }

  // Get history info for UI
  getHistoryInfo() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length
    }
  }
}

export const historyManager = new HistoryManager()
export default historyManager
