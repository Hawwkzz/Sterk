// ============================================
// NETTOYAGE AGRESSIF : supprimer tous les service workers et caches
// ============================================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister()
      console.log('[SW] Unregistered service worker')
    })
  })
}

// Vider tous les caches du service worker
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name)
      console.log('[Cache] Deleted cache:', name)
    })
  })
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import InstallPrompt from './components/InstallPrompt'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <InstallPrompt />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#27272a',
              color: '#fff',
              border: '1px solid #3f3f46',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
