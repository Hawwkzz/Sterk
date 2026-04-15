import { Building2, FileCheck, Users, Euro, AlertCircle, ArrowRight, FolderPlus, TrendingUp, Clock, CheckCircle2, Zap, BarChart3, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEntrepriseStats, useChantiersSansDossier, useDossiersCEE } from '../hooks/useEntreprise'
import { computeExpiryStatus, FICHES } from '../lib/cee'
import { Card, Badge, Spinner, Button } from '../components/ui'
import { CEE_STATUT_CONFIG, CEE_STATUTS } from '../lib/constants'
import { formatCurrency } from '../lib/utils'

export default function EntrepriseDashboardPage() {
  const { entreprise } = useAuth()
  const { stats, loading } = useEntrepriseStats()
  const { chantiers: chantiersSansDossier } = useChantiersSansDossier()
  const { dossiers: recentDossiers, loading: loadingDossiers } = useDossiersCEE()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  const primeEstimee = stats?.primeEstimee || 0
  const primeRecue = stats?.primeRecue || 0
  const totalDossiers = stats?.totalDossiers || 0
  const dossiersValides = (stats?.parStatut?.[CEE_STATUTS.VALIDE] || 0) + (stats?.parStatut?.[CEE_STATUTS.PRIME_RECUE] || 0)
  const dossiersEnCours = totalDossiers - dossiersValides - (stats?.parStatut?.[CEE_STATUTS.REFUSE] || 0)

  return (
    <div className="py-6 space-y-5">
      {/* Header */}
      <div>
        <p className="text-zinc-500 text-sm">Bonjour,</p>
        <h1 className="text-2xl font-bold text-white">
          {entreprise?.nom || 'Mon entreprise'}
        </h1>
      </div>

      {/* Card prime principale */}
      <div className="bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-zinc-900 rounded-2xl p-5 border border-orange-500/20">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-orange-400" />
          <span className="text-orange-300 text-sm font-medium">Primes CEE</span>
        </div>
        <div className="flex items-end justify-between mt-2">
          <div>
            <p className="text-3xl font-black text-white">{formatCurrency(primeEstimee)}</p>
            <p className="text-zinc-400 text-xs mt-1">estimées au total</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-emerald-400">{formatCurrency(primeRecue)}</p>
            <p className="text-zinc-500 text-xs">reçues</p>
          </div>
        </div>
        {primeEstimee > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Récupération</span>
              <span>{primeEstimee > 0 ? Math.round((primeRecue / primeEstimee) * 100) : 0}%</span>
            </div>
            <div className="h-2 bg-zinc-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: `${primeEstimee > 0 ? Math.min((primeRecue / primeEstimee) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mx-auto mb-1">
            <FileCheck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-bold text-white">{totalDossiers}</p>
          <p className="text-zinc-500 text-[10px]">Dossiers</p>
        </Card>
        <Card className="p-3 text-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center mx-auto mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-white">{dossiersValides}</p>
          <p className="text-zinc-500 text-[10px]">Validés</p>
        </Card>
        <Card className="p-3 text-center">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center mx-auto mb-1">
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-white">{stats?.nbEquipes || 0}</p>
          <p className="text-zinc-500 text-[10px]">Équipes</p>
        </Card>
      </div>

      {/* Alerte chantiers sans dossier */}
      {chantiersSansDossier.length > 0 && (
        <button
          onClick={() => navigate('/entreprise/dossiers?new=1')}
          className="w-full text-left"
        >
          <Card className="p-4 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">
                  {chantiersSansDossier.length} chantier{chantiersSansDossier.length > 1 ? 's' : ''} validé{chantiersSansDossier.length > 1 ? 's' : ''} sans dossier CEE
                </p>
                <p className="text-amber-300/70 text-xs mt-1">
                  Créez un dossier pour récupérer vos primes d'énergie
                </p>
              </div>
              <FolderPlus className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
            </div>
          </Card>
        </button>
      )}

      {/* Pipeline des dossiers */}
      {totalDossiers > 0 && (
<Card className="p-4">
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-400" />
            Performance CEE
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-600/20 border border-orange-500/30">
              <p className="text-zinc-400 text-[10px]">Total kWh cumac</p>
              <p className="text-orange-400 font-black text-lg">
                {(recentDossiers || []).reduce((s, d) => s + (Number(d.kwh_cumac) || 0), 0).toLocaleString('fr-FR')}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30">
              <p className="text-zinc-400 text-[10px]">Prime estimée (€)</p>
              <p className="text-emerald-400 font-black text-lg">
                {(recentDossiers || []).reduce((s, d) => s + (Number(d.montant_prime_estime) || 0), 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            Pipeline dossiers
          </h3>
          <div className="space-y-2">
            {Object.entries(CEE_STATUT_CONFIG).map(([key, config]) => {
              const count = stats?.parStatut?.[key] || 0
              if (count === 0) return null
              const percentage = (count / totalDossiers) * 100

              const variantMap = {
                emerald: 'success',
                red: 'danger',
                amber: 'warning',
                blue: 'info',
                purple: 'info',
              }

              return (
                <div key={key} className="flex items-center gap-3">
                  <Badge variant={variantMap[config.color] || 'default'} className="w-28 justify-center text-center">
                    {config.label}
                  </Badge>
                  <div className="flex-1 h-2 bg-zinc-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        config.color === 'emerald' ? 'bg-emerald-500'
                        : config.color === 'amber' ? 'bg-amber-500'
                        : config.color === 'red' ? 'bg-red-500'
                        : config.color === 'purple' ? 'bg-purple-500'
                        : 'bg-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-white font-medium text-sm w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Derniers dossiers */}
      {!loadingDossiers && recentDossiers.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Derniers dossiers</h3>
            <button
              onClick={() => navigate('/entreprise/dossiers')}
              className="text-orange-400 text-xs hover:text-orange-300"
            >
              Voir tout
            </button>
          </div>
          <div className="space-y-2">
            {recentDossiers.slice(0, 3).map(dossier => {
              const dConfig = CEE_STATUT_CONFIG[dossier.statut] || {}
              const variantMap = {
                emerald: 'success', red: 'danger', amber: 'warning', blue: 'info', purple: 'info',
              }
              return (
                <button
                  key={dossier.id}
                  onClick={() => navigate(`/entreprise/dossiers/${dossier.id}`)}
                  className="w-full flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {dossier.chantier?.client_name || 'Client'}
                    </p>
                    <p className="text-zinc-500 text-xs truncate">
                      {dossier.chantier?.equipe?.name}
                    </p>
                  </div>
                  <Badge variant={variantMap[dConfig.color] || 'default'}>
                    {dConfig.label || dossier.statut}
                  </Badge>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {/* Accès rapide */}
      <div className="space-y-2">
        <button
          onClick={() => navigate('/entreprise/dossiers')}
          className="w-full flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/30 hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium text-sm">Dossiers CEE</p>
              <p className="text-zinc-500 text-xs">Gérer les dossiers de primes</p>
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
              <p className="text-white font-medium text-sm">Mes équipes</p>
              <p className="text-zinc-500 text-xs">Voir la performance des équipes</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-500" />
        </button>

        <button
          onClick={() => navigate('/entreprise/parametres')}
          className="w-full flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/30 hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium text-sm">Paramètres primes</p>
              <p className="text-zinc-500 text-xs">Quota et prime par type de travaux</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-500" />
        </button>
      </div>
    </div>
  )
}
