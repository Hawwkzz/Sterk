// Mode démo : accès en lecture seule à l'app avec des données fictives.
// Utilisation :
//   enterDemoMode('entreprise')  // ou 'equipe'
//   isDemoMode()                  // true/false
//   getDemoRole()                 // 'entreprise' | 'equipe' | null
//   exitDemoMode()                // sortie + redirect login
//   blockIfDemo(actionLabel?)     // à appeler en tête de toute action d'écriture
// Le flag est stocké dans localStorage pour survivre aux reloads.

import toast from 'react-hot-toast'

const KEY = 'sterk_demo_role'

export function isDemoMode() {
  if (typeof window === 'undefined') return false
  const v = window.localStorage.getItem(KEY)
  return v === 'entreprise' || v === 'equipe'
}

export function getDemoRole() {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(KEY)
  return v === 'entreprise' || v === 'equipe' ? v : null
}

export function enterDemoMode(role) {
  if (role !== 'entreprise' && role !== 'equipe') return
  window.localStorage.setItem(KEY, role)
}

export function exitDemoMode() {
  window.localStorage.removeItem(KEY)
}

// À appeler au début de toute fonction qui écrit en base.
// Retourne true si l'action a été bloquée (mode démo) → le caller doit return.
export function blockIfDemo(actionLabel = 'Cette action') {
  if (!isDemoMode()) return false
  toast(
    `🔒 Mode démo — ${actionLabel} n'est pas disponible.\nCréez un compte pour activer toutes les fonctionnalités.`,
    { icon: '🎭', duration: 3500 }
  )
  return true
}
