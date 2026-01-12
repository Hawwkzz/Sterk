import { useState, useEffect } from 'react'
import { Download, X, Share } from 'lucide-react'
import { Button } from './ui'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Détecter iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(iOS)

    // Écouter l'événement beforeinstallprompt (Chrome/Android)
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Afficher après 5 secondes
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Sur iOS, afficher après 5 secondes si pas installé
    if (iOS) {
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        setTimeout(() => {
          setShowPrompt(true)
        }, 5000)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (isInstalled || !showPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto animate-slide-up">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-2xl">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-zinc-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">
              Installer STERK LED
            </h3>
            
            {isIOS ? (
              <p className="text-zinc-400 text-sm mb-3">
                Appuyez sur <Share className="w-4 h-4 inline mx-1" /> puis "Sur l'écran d'accueil"
              </p>
            ) : (
              <p className="text-zinc-400 text-sm mb-3">
                Installez l'app pour un accès rapide
              </p>
            )}

            {!isIOS && deferredPrompt && (
              <Button onClick={handleInstall} size="sm">
                Installer
              </Button>
            )}
            
            {isIOS && (
              <Button onClick={handleDismiss} size="sm" variant="secondary">
                J'ai compris
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
