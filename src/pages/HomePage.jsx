import { Link } from 'react-router-dom'
import { ChevronRight, Clock, AlertCircle, Trophy, Zap, Award, CheckCircle, FileText } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useChantiers, useChantierStats, useClassement } from '../hooks/useChantiers'
import { QUOTA_MENSUEL, STATUT_CONFIG, STATUTS } from '../lib/constants'
import { formatDate, formatNumber, formatCurrency } from '../lib/utils'
import { Card, ProgressBar, Spinner } from '../components/ui'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function HomePage() {
  const { equipe } = useAuth()
  const { stats, loading: statsLoading } = useChantierStats()
  const { classement, myRank, loading: classementLoading } = useClassement()
  const { chantiers, loading: chantiersLoading } = useChantiers()

  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: fr })
  const progressQuota = Math.min((stats.ledValidees / QUOTA_MENSUEL) * 100, 100)
  const surQuota = stats.ledValidees > QUOTA_MENSUEL

  // 3 derniers chantiers
  const recentChantiers = chantiers.slice(0, 3)

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-sm font-medium tracking-wider uppercase">
            {currentMonth}
          </p>
          <h1 className="text-2xl font-bold text-white mt-1">Tableau de bord</h1>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
          <Zap className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Carte principale - Quota */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 p-6 border border-zinc-700/50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-zinc-400 text-sm">Production mensuelle</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black text-white">
                {formatNumber(stats.ledValidees)}
              </span>
              <span className="text-zinc-500">/ {formatNumber(QUOTA_MENSUEL)} LED</span>
            </div>
          </div>
          {surQuota && (
            <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <span className="text-emerald-400 text-sm font-semibold">
                +{formatNumber(stats.ledValidees - QUOTA_MENSUEL)} LED
              </span>
            </div>
          )}
        </div>

        <ProgressBar value={stats.ledValidees} max={QUOTA_MENSUEL} />
        <p className="text-zinc-500 text-xs mt-2">
          {progressQuota.toFixed(0)}% du quota atteint
        </p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatNumber(stats.ledEnAttente)}</p>
          <p className="text-zinc-500 text-xs">En attente</p>
        </Card>
        
        <Card className="p-4">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatNumber(stats.ledRefusees)}</p>
          <p className="text-zinc-500 text-xs">À corriger</p>
        </Card>
        
        <Card className="p-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-2">
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {classementLoading ? '-' : `#${myRank || '-'}`}
          </p>
          <p className="text-zinc-500 text-xs">Classement</p>
        </Card>
      </div>

      {/* Prime */}
      <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/10 rounded-2xl p-5 border border-orange-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-300 text-sm font-medium">Prime annuelle cumulée</p>
            <p className="text-3xl font-black text-white mt-1">
              {formatCurrency(stats.primeAnnuelle)}
            </p>
          </div>
          <div className="w-14 h-14 rounded-full bg-orange-500/30 flex items-center justify-center">
            <Award className="w-7 h-7 text-orange-400" />
          </div>
        </div>
        <p className="text-zinc-400 text-xs mt-3">
          5€ par LED au-dessus du quota mensuel
        </p>
      </div>

      {/* Derniers chantiers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Derniers chantiers</h2>
          <Link
            to="/chantiers"
            className="text-orange-400 text-sm font-medium flex items-center gap-1 hover:text-orange-300"
          >
            Voir tout <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {chantiersLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : recentChantiers.length === 0 ? (
          <Card className="p-6 text-center">
            <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500">Aucun chantier pour le moment</p>
            <Link
              to="/chantiers"
              className="inline-block mt-3 text-orange-400 text-sm font-medium hover:text-orange-300"
            >
              Créer un chantier →
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentChantiers.map((chantier) => {
              const config = STATUT_CONFIG[chantier.status] || STATUT_CONFIG[STATUTS.DRAFT]
              const StatusIcon = chantier.status === STATUTS.VALIDE 
                ? CheckCircle 
                : chantier.status === STATUTS.REFUSE 
                  ? AlertCircle 
                  : Clock

              return (
                <Link
                  key={chantier.id}
                  to={`/chantiers/${chantier.id}`}
                  className="block"
                >
                  <Card className="p-4 flex items-center gap-4 hover:bg-zinc-800/70 transition-colors">
                    <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                      <StatusIcon className={`w-5 h-5 ${config.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {chantier.adresse}
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {chantier.led_count} LED · {formatDate(chantier.created_at, 'dd MMM')}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600 flex-shrink-0" />
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
