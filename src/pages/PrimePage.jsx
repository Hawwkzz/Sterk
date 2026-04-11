import { useState, useEffect } from 'react'
import { Award, TrendingUp, Calendar, Info } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useChantierStats } from '../hooks/useChantiers'
import { STATUTS, SECTEUR_DEFAUT } from '../lib/constants'
import { formatCurrency, formatNumber, formatDate } from '../lib/utils'
import { Card, Spinner } from '../components/ui'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function PrimePage() {
  const { equipe, secteur: secteurRaw } = useAuth()
  const secteur = secteurRaw || SECTEUR_DEFAUT
  const { stats, loading: statsLoading } = useChantierStats()
  const [monthlyHistory, setMonthlyHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!equipe) return

    async function fetchHistory() {
      try {
        const months = []
        const now = new Date()

        const QUOTA = secteur.quota_mensuel
        const PRIME_PAR_UNITE = secteur.prime_par_unite

        // Récupérer les 6 derniers mois
        for (let i = 0; i < 6; i++) {
          const monthDate = subMonths(now, i)
          const start = startOfMonth(monthDate)
          const end = endOfMonth(monthDate)

          const { data, error } = await supabase
            .from('chantiers')
            .select('unit_count')
            .eq('equipe_id', equipe.id)
            .eq('status', STATUTS.VALIDE)
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString())

          if (error) throw error

          const totalUnits = data.reduce((sum, c) => sum + (c.unit_count || 0), 0)
          const unitsSurQuota = Math.max(0, totalUnits - QUOTA)
          const prime = unitsSurQuota * PRIME_PAR_UNITE

          months.push({
            month: format(monthDate, 'MMMM yyyy', { locale: fr }),
            totalLed: totalUnits,
            ledSurQuota: unitsSurQuota,
            prime,
            isCurrent: i === 0,
          })
        }

        setMonthlyHistory(months)
      } catch (err) {
        console.error('Error fetching history:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [equipe, secteur])

  if (statsLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Mes primes</h1>

      {/* Prime totale */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/20 rounded-full blur-2xl" />
        <div className="relative">
          <p className="text-orange-100 text-sm font-medium">Prime annuelle 2026</p>
          <p className="text-5xl font-black text-white mt-2">
            {formatCurrency(stats.primeAnnuelle)}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-200" />
            <p className="text-orange-200 text-sm">
              +{formatNumber(Math.max(0, stats.ledValidees - secteur.quota_mensuel))} {secteur.unit_label_plural} au-dessus du quota ce mois
            </p>
          </div>
        </div>
      </div>

      {/* Stats du mois */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-zinc-500 text-xs mb-1">{secteur.unit_label_plural} validé(e)s ce mois</p>
          <p className="text-2xl font-bold text-white">{formatNumber(stats.ledValidees)}</p>
          <p className="text-zinc-600 text-xs mt-1">Quota: {formatNumber(secteur.quota_mensuel)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-zinc-500 text-xs mb-1">Prime ce mois</p>
          <p className="text-2xl font-bold text-orange-400">{formatCurrency(stats.primeMensuelle)}</p>
          <p className="text-zinc-600 text-xs mt-1">{formatCurrency(secteur.prime_par_unite)}/{secteur.unit_label} bonus</p>
        </Card>
      </div>

      {/* Historique mensuel */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Historique mensuel</h2>
        <div className="space-y-2">
          {monthlyHistory.map((month) => (
            <Card
              key={month.month}
              className={`p-4 ${month.isCurrent ? 'border-orange-500/30 bg-orange-500/10' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium capitalize ${month.isCurrent ? 'text-orange-400' : 'text-white'}`}>
                    {month.month} {month.isCurrent && <span className="text-xs ml-2">(en cours)</span>}
                  </p>
                  <p className="text-zinc-500 text-sm">
                    {formatNumber(month.totalLed)} {secteur.unit_label_plural} • +{formatNumber(month.ledSurQuota)} bonus
                  </p>
                </div>
                <p className={`text-xl font-bold ${month.prime > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {month.prime > 0 ? '+' : ''}{formatCurrency(month.prime)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Info */}
      <Card className="p-4 border-blue-500/20 bg-blue-500/5">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium mb-1">Comment ça marche ?</p>
            <p className="text-zinc-400 text-sm">
              Chaque {secteur.unit_label} validé(e) par le client au-dessus du quota mensuel de {formatNumber(secteur.quota_mensuel)} {secteur.unit_label_plural} génère une prime de {formatCurrency(secteur.prime_par_unite)}. La prime est cumulée sur l'année et versée en fin d'exercice.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
            }
