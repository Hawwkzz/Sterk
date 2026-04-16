import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, FileText, Award, BarChart3, Settings, Zap, LogOut, Shield, FileCheck, Users, Building2, Handshake } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { cn } from '../lib/utils'
import DemoBanner from './DemoBanner'

const navItems = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/chantiers', icon: FileText, label: 'Chantiers' },
  { to: '/prime', icon: Award, label: 'Prime' },
  { to: '/classement', icon: BarChart3, label: 'Classement' },
]

const adminNavItems = [
  { to: '/admin', icon: Shield, label: 'Admin' },
]

const entrepriseNavItems = [
  { to: '/entreprise', icon: Home, label: 'Accueil' },
  { to: '/entreprise/dossiers', icon: FileCheck, label: 'Dossiers' },
  { to: '/entreprise/apporteurs', icon: Handshake, label: 'Apporteurs' },
  { to: '/entreprise/equipes', icon: Users, label: 'Équipes' },
]

export default function Layout() {
  const { isAdmin, isEntreprise, equipe, entreprise, signOut } = useAuth()
  const location = useLocation()

  // Ne pas afficher la nav sur la page de validation client
  const isClientPage = location.pathname.startsWith('/validation/')
  if (isClientPage) {
    return <Outlet />
  }

  // Sélectionner les bons items de navigation
  let allNavItems
  if (isEntreprise) {
    allNavItems = entrepriseNavItems
  } else if (isAdmin) {
    allNavItems = [...navItems, ...adminNavItems]
  } else {
    allNavItems = navItems
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative">
        {/* Bandeau mode démo (n'apparaît que si localStorage.sterk_demo_role est set) */}
        <DemoBanner />

        {/* Header */}
        <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/50">
          {/* Status bar placeholder */}
          <div className="h-11 flex items-center justify-center">
            <div className="w-28 h-6 bg-zinc-900 rounded-full" />
          </div>

          {/* Logo & équipe/entreprise */}
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg tracking-tight">EOIA</span>
              <span className="text-zinc-500 text-sm">Energie</span>
            </div>
            <div className="flex items-center gap-3">
              {isEntreprise && entreprise && (
                <>
                  <span className="text-sm text-zinc-400">{entreprise.nom}</span>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
                    Entreprise
                  </span>
                </>
              )}
              {!isEntreprise && equipe && (
                <span className="text-sm text-zinc-400">{equipe.name}</span>
              )}
              {isAdmin && (
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full">
                  Admin
                </span>
              )}
              <button
                onClick={signOut}
                className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
              >
                <LogOut className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-6 pb-24">
          <Outlet />
        </main>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 safe-bottom">
          <div className="max-w-md mx-auto flex items-center justify-around py-2">
            {allNavItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/' || item.to === '/entreprise'}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors',
                      isActive
                        ? 'text-orange-400'
                        : 'text-zinc-500 hover:text-zinc-300'
                    )}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn('w-6 h-6', isActive && 'stroke-[2.5]')} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
