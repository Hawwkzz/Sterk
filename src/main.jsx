// ============================================
// Service Worker : nettoyage et récupération
// ============================================
if ('serviceWorker' in navigator) {
  // Forcer la mise à jour du SW au chargement
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.update()
    })
  })

  // Détecter si l'app est bloquée en chargement et forcer un recovery
  // Si après 5 secondes le root est toujours vide, on vide le cache SW
  setTimeout(() => {
    const root = document.getElementById('root')
    if (root && root.children.length === 0) {
      console.warn('[SW Recovery] App seems stuck, clearing SW caches...')
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name))
        }).then(() => {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(r => r.unregister())
          }).then(() => {
            window.location.reload()
          })
        })
      }
    }
  }, 5000)
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
