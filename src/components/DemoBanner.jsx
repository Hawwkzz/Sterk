import { useNavigate } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import { isDemoMode, exitDemoMode, getDemoRole } from '../lib/demoMode'

// Bandeau orange fixe en haut de l'app quand on est en mode démo.
// À monter dans Layout.jsx.
export default function DemoBanner() {
  const navigate = useNavigate()
  if (!isDemoMode()) return null
  const role = getDemoRole()

  function quit() {
    exitDemoMode()
    // Force un rechargement propre pour que AuthContext reparte from scratch.
    window.location.href = '/login'
  }

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            <strong>Mode démo {role === 'entreprise' ? 'Entreprise' : 'Équipe'}</strong>
            <span className="hidden sm:inline"> — Les données sont fictives, aucune action n'est enregistrée.</span>
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate('/login')}
            className="hidden sm:inline-flex px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors font-medium"
          >
            Créer un compte
          </button>
          <button
            onClick={quit}
            aria-label="Quitter la démo"
            className="p-1 rounded-md hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
