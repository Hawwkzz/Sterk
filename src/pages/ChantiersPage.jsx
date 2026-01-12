import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ChevronRight, Zap, CheckCircle, Clock, AlertCircle, FileText, Search, Filter } from 'lucide-react'
import { useChantiers } from '../hooks/useChantiers'
import { STATUT_CONFIG, STATUTS } from '../lib/constants'
import { formatDate, formatNumber } from '../lib/utils'
import { Card, Button, Input, Spinner, EmptyState, Badge } from '../components/ui'
import NewChantierModal from '../components/NewChantierModal'

const STATUS_ICONS = {
  [STATUTS.VALIDE]: CheckCircle,
  [STATUTS.PENDING_CLIENT]: Clock,
  [STATUTS.REFUSE]: AlertCircle,
  [STATUTS.DRAFT]: FileText,
  [STATUTS.CORRIGE]: Clock,
}

const FILTERS = [
  { value: '', label: 'Tous' },
  { value: STATUTS.VALIDE, label: 'Validés' },
  { value: STATUTS.PENDING_CLIENT, label: 'En attente' },
  { value: STATUTS.REFUSE, label: 'Refusés' },
  { value: STATUTS.DRAFT, label: 'Brouillons' },
]

export default function ChantiersPage() {
  const [showNewChantier, setShowNewChantier] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const { chantiers, loading, refetch } = useChantiers({ status: statusFilter || undefined })

  // Filtrer par recherche
  const filteredChantiers = chantiers.filter(chantier => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      chantier.adresse?.toLowerCase().includes(query) ||
      chantier.client_name?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Chantiers</h1>
        <Button
          onClick={() => setShowNewChantier(true)}
          size="sm"
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Nouveau
        </Button>
      </div>

      {/* Recherche */}
      <Input
        type="text"
        placeholder="Rechercher un chantier..."
        icon={Search}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === filter.value
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Liste des chantiers */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredChantiers.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun chantier"
          description={searchQuery || statusFilter ? "Aucun chantier ne correspond à vos critères" : "Commencez par créer votre premier chantier"}
          action={
            !searchQuery && !statusFilter && (
              <Button onClick={() => setShowNewChantier(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Créer un chantier
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredChantiers.map((chantier) => {
            const config = STATUT_CONFIG[chantier.status] || STATUT_CONFIG[STATUTS.DRAFT]
            const StatusIcon = STATUS_ICONS[chantier.status] || FileText

            return (
              <Link
                key={chantier.id}
                to={`/chantiers/${chantier.id}`}
                className="block"
              >
                <Card className="p-4 hover:bg-zinc-800/70 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon className={`w-6 h-6 ${config.textColor}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <Badge
                          variant={
                            chantier.status === STATUTS.VALIDE ? 'success' :
                            chantier.status === STATUTS.REFUSE ? 'danger' :
                            chantier.status === STATUTS.PENDING_CLIENT ? 'warning' :
                            'default'
                          }
                        >
                          {config.label}
                        </Badge>
                        <span className="text-zinc-500 text-xs">
                          {formatDate(chantier.created_at, 'dd MMM')}
                        </span>
                      </div>
                      
                      <p className="text-white font-medium truncate">
                        {chantier.adresse}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-zinc-400 text-sm">
                          <Zap className="w-4 h-4" />
                          {formatNumber(chantier.led_count)} LED
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-zinc-400 text-sm truncate">
                          {chantier.client_name}
                        </span>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-zinc-600 flex-shrink-0 mt-3" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Modal nouveau chantier */}
      <NewChantierModal
        open={showNewChantier}
        onClose={() => setShowNewChantier(false)}
        onSuccess={() => {
          setShowNewChantier(false)
          refetch()
        }}
      />
    </div>
  )
}
