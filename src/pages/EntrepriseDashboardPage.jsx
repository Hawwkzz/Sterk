import { Building2, FileCheck, Users, Euro, AlertCircle, ArrowRight, FolderPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEntrepriseStats, useChantiersSansDossier } from '../hooks/useEntreprise'
import { Card, Badge, Spinner, StatCard, Button } from '../components/ui'
import { CEE_STATUT_CONFIG, CEE_STATUTS } from '../lib/constants'
import { formatCurrency } from '../lib/utils'

export default function EntrepriseDashboardPage() {
  const { entreprise } = useAuth()
  const { stats, loading } = useEntrepriseStats()
  const { chantiers: chantiersSansDossier } = useChantiersSansDossier()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {entreprise?.nom || 'Mon entreprise'}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Tableau de bord CEE</p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={FileCheck}
          label="Dossiers CEE"
          value={stats?.totalDossiers || 0}
          variant="default"
        />
        <StatCard
          icon={Users}
          label="Ãquipes"
          value={stats?.nbEquipes || 0}
          variant="default"
        />
        <StatCard
          icon={Euro}
          label="Primes estimÃ©es"
          value={formatCurrency(stats?.primeEstimee || 0)}
          variant="orange"
        />
        <StatCard
          icon={Euro}
          label="Primes reÃ§ues"
          value={formatCurrency(stats?.primeRecue || 0)}
          variant="default"
        />
      </div>

      {/* Alerte chantiers sans dossier */}
      {chantiersSansDossier.length > 0 && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">
                {chantiersSansDossier.length} chantier{chantiersSansDossier.length > 1 ? 's' : ''} validÃ©{chantiersSansDossier.length > 1 ? 's' : ''} sans dossier CEE
              </p>
              <p className="text-zinc-400 text-xs mt-1">
                CrÃ©ez un dossier pour rÃ©cupÃ©rer les primes
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/entreprise/dossiers?new=1')}
            >
              <FolderPlus className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* RÃ©partition par statut */}
      {stats?.totalDossiers > 0 && (
        <Card className="p-4">
          <h3 className="text-white font-semibold mb-3">Statuts des dossiers</h3>
          <div className="space-y-2">
            {Object.entries(CEE_STATUT_CONFIG).map(([key, config]) => {
              const count = stats?.parStatut?.[key] || 0
              if (count === 0) return null
              return (
                <div key={key} className="flex items-center justify-between">
                  <Badge variant={config.color === 'emerald' ? 'success' : config.color === 'red' ? 'danger' : config.color === 'amber' ? 'warning' : 'info'}>
                    {config.label}
                  </Badge>
                  <span className="text-white font-medium text-sm">{count}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* AccÃ¨s rapide */}
      <div className="space-y-2">
        <button
          onClick={() => navigate('/entreprise/dossiers')}
          className="w-x-full flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/30 hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium text-sm">Dossiers CEE</p>
              <p className="text-zinc-500 text-xs">GÃ©rer les dossiers de primes</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-500" />
        </button>

        <button
          onClick={() => navigate('/entreprise/equipes')}
          className="w-full flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/30 hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium text-sm">Mes Ã©quipes</p>
              <p className="text-zinc-500 text-xs">Voir la performance des Ã©quipes</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-500" />
        </button>
      </div>
    </div>
  )
}

