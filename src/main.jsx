import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Initialize Capacitor if running on mobile
async function initializeApp() {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) {
      const { SplashScreen } = await import('@capacitor/splash-screen')
      // Hide splash screen when app is ready
      setTimeout(() => {
        SplashScreen.hide().catch(err => console.error('Failed to hide splash screen:', err))
      }, 500)
    }
  } catch (err) {
    console.log('Running on web')
  }
}

initializeApp()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
