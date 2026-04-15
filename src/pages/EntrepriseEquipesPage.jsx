import { useState } from 'react'
import { Users, Trophy, Zap, Pencil, X } from 'lucide-react'
import { useEntrepriseEquipes } from '../hooks/useEntreprise'
import { Card, Badge, Spinner, EmptyState } from '../components/ui'
import { supabase } from '../lib/supabase'
import { isDemoMode } from '../lib/demoMode'
import toast from 'react-hot-toast'

export default function EntrepriseEquipesPage() {
  const { equipes, loading, refetch } = useEntrepriseEquipes()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', responsable: '' })
  const [saving, setSaving] = useState(false)

  function openEdit(eq) {
    setForm({ name: eq.name, responsable: eq.responsable || '' })
    setEditing(eq)
  }

  async function saveEdit() {
    if (!form.name.trim()) { toast.error('Le nom est requis'); return }
    if (isDemoMode()) {
      toast('Mode interface — modification non persistée', { icon: 'ℹ️' })
      setEditing(null)
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('equipes')
        .update({ name: form.name.trim(), responsable: form.responsable.trim() || null })
        .eq('id', editing.id)
      if (error) throw error
      toast.success('Équipe mise à jour')
      setEditing(null)
      refetch()
    } catch (err) {
      toast.error('Erreur : ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (equipes.length === 0) {
    return (
      <div className="py-6">
        <EmptyState
          icon={Users}
          title="Aucune équipe"
          description="Aucune équipe n'est rattachée à votre entreprise."
        />
      </div>
    )
  }

  const sorted = [...equipes].sort((a, b) => b.chantiersValides - a.chantiersValides)

  return (
    <div className="py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Mes équipes</h1>
        <p className="text-zinc-500 text-sm">{equipes.length} équipe{equipes.length > 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-2">
        {sorted.map((eq, index) => (
          <Card key={eq.id} className="p-4">
            <div className="flex items-start gap-3">
              {/* Rang */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                index === 0 ? 'bg-amber-500/20' : index === 1 ? 'bg-zinc-400/20' : index === 2 ? 'bg-orange-800/20' : 'bg-zinc-800'
              }`}>
                {index < 3 ? (
                  <Trophy className={`w-5 h-5 ${
                    index === 0 ? 'text-amber-400' : index === 1 ? 'text-zinc-400' : 'text-orange-700'
                  }`} />
                ) : (
                  <span className="text-zinc-500 font-bold text-sm">#{index + 1}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm truncate">{eq.name}</p>
                  {eq.blocked && <Badge variant="danger">Bloquée</Badge>}
                </div>
                {eq.responsable && (
                  <p className="text-zinc-500 text-xs mt-0.5">{eq.responsable}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {eq.secteur && (
                    <Badge variant="orange">
                      <Zap className="w-3 h-3 mr-1" />
                      {eq.secteur.label}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats + bouton édition */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="text-right">
                  <p className="text-white font-bold text-lg">{eq.chantiersValides}</p>
                  <p className="text-zinc-500 text-xs">chantiers</p>
                </div>
                <button
                  onClick={() => openEdit(eq)}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-orange-400 transition-colors px-2 py-1 rounded-lg hover:bg-orange-500/10"
                >
                  <Pencil className="w-3 h-3" />
                  Modifier
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal édition équipe */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Modifier l'équipe</h3>
              <button onClick={() => setEditing(null)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 text-xs block mb-1.5">Nom de l'équipe</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-orange-500"
                  placeholder="Ex: Équipe Nord"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-xs block mb-1.5">Responsable</label>
                <input
                  value={form.responsable}
                  onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-orange-500"
                  placeholder="Ex: Thomas Lemaire"
                />
              </div>
            </div>

            {isDemoMode() && (
              <p className="text-amber-400/80 text-xs bg-amber-500/10 rounded-lg px-3 py-2">
                Mode interface — les modifications ne seront pas enregistrées
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
