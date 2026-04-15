import { useState } from 'react'
import { Euro, Target, Check, Settings } from 'lucide-react'
import { useEntrepriseParamsPrimes } from '../hooks/useEntreprise'
import { Card, Spinner } from '../components/ui'
import { isDemoMode } from '../lib/demoMode'

const SECTEUR_ICONS = { led: '💡', pac: '🌡️', pv: '☀️', irve: '⚡' }

export default function EntrepriseParametresPage() {
  const { secteurs, loading, saving, saveParam, getEffectiveValues } = useEntrepriseParamsPrimes()
  const [editValues, setEditValues] = useState({})
  const [savedRows, setSavedRows] = useState({})

  if (loading) return (
    <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
  )

  const getEditValue = (secteur, field) => {
    const key = `${secteur.id}.${field}`
    if (key in editValues) return editValues[key]
    return getEffectiveValues(secteur)[field]
  }

  const handleChange = (secteurId, field, value) => {
    setEditValues(prev => ({ ...prev, [`${secteurId}.${field}`]: value }))
    setSavedRows(prev => ({ ...prev, [secteurId]: false }))
  }

  const handleSave = async (secteur) => {
    const prime = getEditValue(secteur, 'prime_par_unite')
    const quota = getEditValue(secteur, 'quota_mensuel')
    const result = await saveParam(secteur.id, prime, quota)
    if (result?.success) {
      setSavedRows(prev => ({ ...prev, [secteur.id]: true }))
      setTimeout(() => setSavedRows(prev => ({ ...prev, [secteur.id]: false })), 2500)
    }
  }

  const isDirty = (secteur) => {
    const eff = getEffectiveValues(secteur)
    const editPrime = editValues[`${secteur.id}.prime_par_unite`]
    const editQuota = editValues[`${secteur.id}.quota_mensuel`]
    return (editPrime !== undefined && parseFloat(editPrime) !== parseFloat(eff.prime_par_unite))
        || (editQuota !== undefined && parseInt(editQuota) !== parseInt(eff.quota_mensuel))
  }

  return (
    <div className="py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-orange-400" />
          Paramètres des primes
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Définissez le quota mensuel et la prime par unité pour chaque type de travaux.
          Ces valeurs s'appliquent à toutes vos équipes.
        </p>
      </div>

      {isDemoMode() && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <p className="text-blue-300 text-sm">Mode démo — les modifications ne sont pas sauvegardées.</p>
        </div>
      )}

      <div className="space-y-3">
        {secteurs.map(secteur => {
          const isSaving = saving === secteur.id
          const isSaved = savedRows[secteur.id]
          const dirty = isDirty(secteur)
          const eff = getEffectiveValues(secteur)

          return (
            <Card key={secteur.id} className={`p-4 ${eff.hasOverride ? 'border-orange-500/30' : ''}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{SECTEUR_ICONS[secteur.slug] || '🔧'}</span>
                <div>
                  <p className="text-white font-semibold">{secteur.label}</p>
                  <p className="text-zinc-500 text-xs">Unité : {secteur.unit_label}</p>
                </div>
                {eff.hasOverride && (
                  <span className="ml-auto text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">
                    Personnalisé
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-zinc-400 text-xs mb-1 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Quota mensuel
                  </label>
                  <div className="relative">
                    <input
                      type="number" min="0"
                      value={getEditValue(secteur, 'quota_mensuel')}
                      onChange={e => handleChange(secteur.id, 'quota_mensuel', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none pr-10"
                    />
                    <span className="absolute right-2 top-2 text-zinc-500 text-xs truncate max-w-[28px]">{secteur.unit_label}</span>
                  </div>
                  <p className="text-zinc-600 text-xs mt-0.5">Défaut : {secteur.quota_mensuel}</p>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1 flex items-center gap-1">
                    <Euro className="w-3 h-3" /> Prime / unité bonus
                  </label>
                  <div className="relative">
                    <input
                      type="number" min="0" step="0.5"
                      value={getEditValue(secteur, 'prime_par_unite')}
                      onChange={e => handleChange(secteur.id, 'prime_par_unite', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none pr-6"
                    />
                    <span className="absolute right-2 top-2 text-zinc-500 text-xs">€</span>
                  </div>
                  <p className="text-zinc-600 text-xs mt-0.5">Défaut : {secteur.prime_par_unite}€</p>
                </div>
              </div>

              <div className="bg-zinc-800/50 rounded-lg p-2.5 mb-3 text-xs text-zinc-400">
                Au-delà de{' '}
                <strong className="text-white">{getEditValue(secteur, 'quota_mensuel')} {secteur.unit_label}</strong>/mois,
                chaque unité rapporte{' '}
                <strong className="text-orange-400">{getEditValue(secteur, 'prime_par_unite')}€</strong> de prime.
              </div>

              <button
                onClick={() => handleSave(secteur)}
                disabled={isSaving || (!dirty && !isSaved)}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  isSaved
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : dirty
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                {isSaving ? <Spinner size="sm" /> : isSaved ? <><Check className="w-4 h-4" /> Enregistré</> : 'Sauvegarder'}
              </button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
