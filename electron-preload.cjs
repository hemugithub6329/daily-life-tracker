const { contextBridge, ipcRenderer } = require('electron')

// Expose controlled API to renderer via contextBridge (security best practice)
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  readFile: () => ipcRenderer.invoke('read-file'),
  writeFile: (data) => ipcRenderer.invoke('write-file', data),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
  
  // Import/Export
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: () => ipcRenderer.invoke('import-data'),
  
  // Platform info
  isElectron: true,
  platform: process.platform
})
