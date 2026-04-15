import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, FileText, Award, BarChart3, Settings, Zap, LogOut, Shield, FileCheck, Users } from 'lucide-react'
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
  { to: '/entreprise/equipes', icon: Users, label: 'Équipes' },
  { to: '/entreprise/parametres', icon: Settings, label: 'Primes' },
]

export default function Layout() {
  const { isAdmin, isEntreprise, equipe, entreprise, signOut } = useAuth()
  const location = useLocation()

  const isClientPage = location.pathname.startsWith('/validation/')
  if (isClientPage) return <Outlet />

  let allNavItems
  if (isEntreprise) allNavItems = entrepriseNavItems
  else if (isAdmin) allNavItems = [...navItems, ...adminNavItems]
  else allNavItems = navItems

  const entityName = isEntreprise ? (entreprise?.nom || entreprise?.name) : equipe?.name
  const entityLabel = isEntreprise ? 'Entreprise' : isAdmin ? 'Admin' : null

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* ── Sidebar desktop (masquée sur mobile) ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-zinc-900 border-r border-zinc-800/80 z-50">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2 border-b border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight">EOIA</span>
          <span className="text-zinc-500 text-sm">Energie</span>
        </div>

        {/* Entité connectée */}
        {entityName && (
          <div className="px-5 py-3 border-b border-zinc-800/60">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5">
              {isEntreprise ? 'Entreprise' : 'Équipe'}
            </p>
            <p className="text-sm text-white font-medium truncate">{entityName}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {allNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/' || item.to === '/entreprise'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium w-full',
                    isActive
                      ? 'bg-orange-500/15 text-orange-400'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'stroke-[2.5]')} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Déconnexion */}
        <div className="px-3 py-4 border-t border-zinc-800">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors w-full text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ── Zone principale (décalée à droite sur desktop) ── */}
      <div className="lg:pl-60 flex flex-col min-h-screen">

        <DemoBanner />

        {/* Header */}
        <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/50">
          {/* Barre de statut simulée — mobile uniquement */}
          <div className="lg:hidden h-11 flex items-center justify-center">
            <div className="w-28 h-6 bg-zinc-900 rounded-full" />
          </div>

          <div className="px-6 py-3 flex items-center justify-between">
            {/* Logo — mobile uniquement */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg tracking-tight">EOIA</span>
              <span className="text-zinc-500 text-sm">Energie</span>
            </div>

            {/* Droite : entité + badge + déco */}
            <div className="flex items-center gap-3 ml-auto">
              {entityName && (
                <span className="hidden lg:inline text-sm text-zinc-400 truncate max-w-[200px]">
                  {entityName}
                </span>
              )}
              {entityLabel && (
                <span className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  isEntreprise ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                )}>
                  {entityLabel}
                </span>
              )}
              {/* Bouton déco — mobile uniquement (desktop : sidebar) */}
              <button
                onClick={signOut}
                className="lg:hidden w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
              >
                <LogOut className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1 px-4 sm:px-6 lg:px-10 pb-24 lg:pb-10">
          <div className="max-w-md mx-auto lg:max-w-4xl lg:mx-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Navigation basse — mobile uniquement ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 safe-bottom z-40">
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
                    isActive ? 'text-orange-400' : 'text-zinc-500 hover:text-zinc-300'
                  )
                }
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
  )
}
