import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FileCheck, Plus, Search, Filter, FolderPlus, ChevronRight, Calendar, MapPin } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useDossiersCEE, useChantiersSansDossier } from '../hooks/useEntreprise'
import { supabase } from '../lib/supabase'
import { Card, Badge, Button, Spinner, EmptyState, Modal, Input } from '../components/ui'
import { CEE_STATUT_CONFIG, CEE_STATUTS } from '../lib/constants'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'
import { computeExpiryStatus } from '../lib/cee'

const FILTER_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: CEE_STATUTS.A_COMPLETER, label: 'À compléter' },
  { value: CEE_STATUTS.PRET, label: 'Prêt' },
  { value: CEE_STATUTS.ENVOYE, label: 'Envoyé' },
  { value: CEE_STATUTS.EN_TRAITEMENT, label: 'En traitement' },
  { value: CEE_STATUTS.VALIDE, label: 'Validé' },
  { value: CEE_STATUTS.REFUSE, label: 'Refusé' },
  { value: CEE_STATUTS.PRIME_RECUE, label: 'Prime reçue' },
]

export default function DossiersCEEPage() {
  const { entreprise } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [statutFilter, setStatutFilter] = useState('')
  const [showNewModal, setShowNewModal] = useState(searchParams.get('new') === '1')
  const [search, setSearch] = useState('')

  const { dossiers, loading, refetch } = useDossiersCEE({ statut: statutFilter || undefined })
  const { chantiers: chantiersSansDossier, loading: loadingChantiers, refetch: refetchChantiers } = useChantiersSansDossier()

  // Filtrage par recherche
  const filteredDossiers = dossiers.filter(d => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      d.chantier?.adresse?.toLowerCase().includes(q) ||
      d.chantier?.client_name?.toLowerCase().includes(q) ||
      d.chantier?.equipe?.name?.toLowerCase().includes(q) ||
      d.delegataire?.toLowerCase().includes(q) ||
      d.reference_externe?.toLowerCase().includes(q)
    )
  })

  async function creerDossier(chantierId) {
    try {
      const { data, error } = await supabase
        .from('dossiers_cee')
        .insert({
          chantier_id: chantierId,
          entreprise_id: entreprise.id,
          statut: CEE_STATUTS.A_COMPLETER,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Dossier CEE créé')
      setShowNewModal(false)
      refetch()
      refetchChantiers()
      navigate(`/entreprise/dossiers/${data.id}`)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la création du dossier')
    }
  }

  function getStatutBadge(statut) {
    const config = CEE_STATUT_CONFIG[statut]
    if (!config) return <Badge>{statut}</Badge>

    const variantMap = {
      emerald: 'success',
      red: 'danger',
      amber: 'warning',
      blue: 'info',
      purple: 'info',
    }

    return <Badge variant={variantMap[config.color] || 'default'}>{config.label}</Badge>
  }

  function getDocumentProgress(dossier) {
    const docs = dossier.documents || []
    const valides = docs.filter(d => d.valide).length
    const total = docs.length
    return { valides, total }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dossiers CEE</h1>
          <p className="text-zinc-500 text-sm">{dossiers.length} dossier{dossiers.length > 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => setShowNewModal(true)}>
          <Plus className="w-4 h-4" />
          Nouveau
        </Button>
      </div>

      {/* Recherche */}
      <Input
        icon={Search}
        placeholder="Rechercher un dossier..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Filtres statut */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatutFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              statutFilter === opt.value
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Liste des dossiers */}
      {filteredDossiers.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="Aucun dossier"
          description={statutFilter ? 'Aucun dossier avec ce statut' : 'Créez votre premier dossier CEE'}
          action={
            <Button size="sm" onClick={() => setShowNewModal(true)}>
              <FolderPlus className="w-4 h-4" />
              Créer un dossier
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredDossiers.map(dossier => {
            const { valides, total } = getDocumentProgress(dossier)
            return (
              <button
                key={dossier.id}
                onClick={() => navigate(`/entreprise/dossiers/${dossier.id}`)}
                className="w-full text-left"
              >
                <Card className="p-4 hover:bg-zinc-800/70 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {dossier.chantier?.client_name || 'Client'}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                        <p className="text-zinc-500 text-xs truncate">
                          {dossier.chantier?.adresse || 'Adresse inconnue'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600 flex-shrink-0" />
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      {getStatutBadge(dossier.statut)}
                      {(() => { const e = computeExpiryStatus(dossier.date_facture); if (e.status === 'unknown' || e.status === 'ok') return null; const colors = { expired: 'bg-red-500/20 text-red-400', critical: 'bg-red-500/20 text-red-400', warning: 'bg-amber-500/20 text-amber-400' }; const labels = { expired: `Expiré +${Math.abs(e.daysLeft)}j`, critical: `${e.daysLeft}j restants`, warning: `${e.daysLeft}j restants` }; return <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${colors[e.status]}`}>⏱️ {labels[e.status]}</span>; })()}
                      {dossier.delegataire && (
                        <span className="text-zinc-600 text-xs">{dossier.delegataire}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="text-zinc-500">{dossier.chantier?.equipe?.name}</span>
                      {total > 0 && (
                        <span className={valides === total ? 'text-emerald-400' : 'text-amber-400'}>
                          {valides}/{total} docs
                        </span>
                      )}
                    </div>
                  </div>

                  {dossier.montant_prime_estime && (
                    <div className="mt-2 pt-2 border-t border-zinc-700/30 flex items-center justify-between">
                      <span className="text-zinc-500 text-xs">Prime estimée</span>
                      <span className="text-orange-400 font-medium text-sm">
                        {parseFloat(dossier.montant_prime_estime).toLocaleString('fr-FR')} €
                      </span>
                    </div>
                  )}
                </Card>
              </button>
            )
          })}
        </div>
      )}

      {/* Modal nouveau dossier */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="Nouveau dossier CEE">
        <div className="p-6">
          {loadingChantiers ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : chantiersSansDossier.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title="Aucun chantier disponible"
              description="Tous les chantiers validés ont déjà un dossier CEE, ou il n'y a pas encore de chantier validé."
            />
          ) : (
            <div className="space-y-2">
              <p className="text-zinc-400 text-sm mb-4">
                Sélectionnez un chantier validé pour créer son dossier CEE :
              </p>
              {chantiersSansDossier.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => creerDossier(ch.id)}
                  className="w-full text-left p-3 bg-zinc-800 rounded-xl border border-zinc-700/30 hover:border-orange-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">{ch.client_name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{ch.adresse}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-zinc-600 text-xs">{ch.equipe?.name}</span>
                        {ch.date_intervention && (
                          <>
                            <span className="text-zinc-700">•</span>
                            <span className="text-zinc-600 text-xs flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(ch.date_intervention)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-orange-400">
                      <FolderPlus className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
