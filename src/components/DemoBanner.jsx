import { useNavigate } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import { isDemoMode, exitDemoMode, getDemoRole } from '../lib/demoMode'

// ⚠️ Change cette adresse si besoin : c'est là que seront envoyées les demandes d'accès
const DEMANDE_EMAIL = 'bousanna.o@boia.info'

// Bandeau orange fixe en haut de l'app quand on est en mode démo.
// À monter dans Layout.jsx.
export default function DemoBanner() {
  const navigate = useNavigate()
  if (!isDemoMode()) return null
  const role = getDemoRole()

  function quit() {
    exitDemoMode()
    window.location.href = '/login'
  }

  function demanderAcces() {
    const subject = encodeURIComponent('Demande d\'accès à Sterk')
    const body = encodeURIComponent(
      `Bonjour,\n\n` +
      `Je viens de tester la démo de Sterk (côté ${role === 'entreprise' ? 'Entreprise' : 'Équipe'}) et j'aimerais avoir un accès personnel pour essayer avec mes propres chantiers.\n\n` +
      `Nom / Entreprise : \n` +
      `Téléphone : \n` +
      `Secteur principal (LED, PAC, PV, IRVE) : \n\n` +
      `Merci !`
    )
    window.location.href = `mailto:${DEMANDE_EMAIL}?subject=${subject}&body=${body}`
  }

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            <strong>Mode démo {role === 'entreprise' ? 'Entreprise' : 'Équipe'}</strong>
            <span className="hidden sm:inline"> — Données fictives, aucune action enregistrée.</span>
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={demanderAcces}
            className="hidden sm:inline-flex px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors font-medium"
          >
            Demander un accès
          </button>
          <button
            onClick={demanderAcces}
            className="sm:hidden px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors font-medium text-xs"
          >
            Accès
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
