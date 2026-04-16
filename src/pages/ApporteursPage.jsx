import { useState } from 'react'
import { Users, Plus, Phone, Mail, Building2, Euro, Percent, Check, X, Pencil } from 'lucide-react'
import { useApporteurs } from '../hooks/useEntreprise'
import { Card, Badge, Button, Spinner, EmptyState, Modal, Input } from '../components/ui'
import { formatCurrency } from '../lib/utils'
import toast from 'react-hot-toast'

export default function ApporteursPage() {
  const { apporteurs, loading, createApporteur, updateApporteur, toggleActif } = useApporteurs()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  function emptyForm() {
    return {
      nom: '', societe: '', email: '', telephone: '', siret: '',
      taux_commission_default: 10, mode_commission: 'pourcentage',
      forfait_default: '', commentaire: '',
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setShowModal(true)
  }

  function openEdit(a) {
    setEditing(a)
    setForm({
      nom: a.nom || '',
      societe: a.societe || '',
      email: a.email || '',
      telephone: a.telephone || '',
      siret: a.siret || '',
      taux_commission_default: a.taux_commission_default ?? 10,
      mode_commission: a.mode_commission || 'pourcentage',
      forfait_default: a.forfait_default ?? '',
      commentaire: a.commentaire || '',
    })
    setShowModal(true)
  }

  async function save() {
    if (!form.nom.trim()) { toast.error('Nom requis'); return }
    setSaving(true)
    const payload = {
      ...form,
      taux_commission_default: Number(form.taux_commission_default) || 0,
      forfait_default: form.forfait_default === '' ? null : Number(form.forfait_default),
    }
    const res = editing
      ? await updateApporteur(editing.id, payload)
      : await createApporteur(payload)
    setSaving(false)
    if (res.success) {
      toast.success(editing ? 'Apporteur mis à jour' : 'Apporteur créé')
      setShowModal(false)
    } else {
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  const totalDue = apporteurs.reduce((s, a) => s + Number(a.commission_due || 0), 0)
  const totalPayee = apporteurs.reduce((s, a) => s + Number(a.commission_payee || 0), 0)
  const totalDossiers = apporteurs.reduce((s, a) => s + Number(a.nb_dossiers || 0), 0)

  return (
    <div className="py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-400" />
            Apporteurs d'affaires
          </h1>
          <p className="text-zinc-500 text-sm">{apporteurs.length} apporteur{apporteurs.length > 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nouveau
        </Button>
      </div>

      {/* Stats */}
      {apporteurs.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3">
            <p className="text-zinc-500 text-[10px] uppercase">Dossiers apportés</p>
            <p className="text-white font-bold text-lg">{totalDossiers}</p>
          </Card>
          <Card className="p-3">
            <p className="text-zinc-500 text-[10px] uppercase">Commission due</p>
            <p className="text-amber-400 font-bold text-lg">{formatCurrency(totalDue)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-zinc-500 text-[10px] uppercase">Commission payée</p>
            <p className="text-emerald-400 font-bold text-lg">{formatCurrency(totalPayee)}</p>
          </Card>
        </div>
      )}

      {/* Liste */}
      {apporteurs.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun apporteur"
          description="Ajoutez un apporteur pour tracer les commissions sur les leads apportés."
          action={<Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> Nouveau</Button>}
        />
      ) : (
        <div className="space-y-2">
          {apporteurs.map(a => (
            <Card key={a.id} className={`p-4 ${a.actif === false ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold text-sm truncate">{a.nom}</p>
                    {a.actif === false && <Badge variant="default">Inactif</Badge>}
                    {a.mode_commission === 'pourcentage' ? (
                      <Badge variant="info"><Percent className="w-3 h-3 inline" /> {a.taux_commission_default}%</Badge>
                    ) : (
                      <Badge variant="info"><Euro className="w-3 h-3 inline" /> {a.forfait_default}€</Badge>
                    )}
                  </div>
                  {a.societe && (
                    <p className="text-zinc-400 text-xs flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3" />{a.societe}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-zinc-500">
                    {a.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{a.email}</span>}
                    {a.telephone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.telephone}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(a)} className="text-zinc-400 hover:text-orange-400 p-1">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats apporteur */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-700/30">
                <div>
                  <p className="text-zinc-500 text-[9px] uppercase">Dossiers</p>
                  <p className="text-white font-semibold text-sm">{a.nb_dossiers || 0}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-[9px] uppercase">Commission due</p>
                  <p className="text-amber-400 font-semibold text-sm">{formatCurrency(a.commission_due || 0)}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-[9px] uppercase">Payée</p>
                  <p className="text-emerald-400 font-semibold text-sm">{formatCurrency(a.commission_payee || 0)}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleActif(a.id, !a.actif)}
                >
                  {a.actif === false ? <><Check className="w-3 h-3" /> Réactiver</> : <><X className="w-3 h-3" /> Désactiver</>}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal création / édition */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Modifier l'apporteur" : "Nouvel apporteur"}>
        <div className="p-6 space-y-3">
          <Input label="Nom *" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Jean Dupont" />
          <Input label="Société" value={form.societe} onChange={e => setForm({ ...form, societe: e.target.value })} placeholder="Rénov Conseil (facultatif)" />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="Téléphone" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
          <Input label="SIRET" value={form.siret} onChange={e => setForm({ ...form, siret: e.target.value })} placeholder="14 chiffres (facultatif)" />

          <div>
            <label className="text-zinc-400 text-xs block mb-1">Mode de commission</label>
            <select
              value={form.mode_commission}
              onChange={e => setForm({ ...form, mode_commission: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-3 text-white text-sm"
            >
              <option value="pourcentage">% de la prime CEE</option>
              <option value="forfait">Forfait fixe par dossier</option>
            </select>
          </div>

          {form.mode_commission === 'pourcentage' ? (
            <Input
              label="Taux de commission par défaut (%)"
              type="number" step="0.1" min="0" max="100"
              value={form.taux_commission_default}
              onChange={e => setForm({ ...form, taux_commission_default: e.target.value })}
            />
          ) : (
            <Input
              label="Forfait par dossier (€)"
              type="number" step="0.01" min="0"
              value={form.forfait_default}
              onChange={e => setForm({ ...form, forfait_default: e.target.value })}
            />
          )}

          <div>
            <label className="text-zinc-400 text-xs block mb-1">Commentaire</label>
            <textarea
              value={form.commentaire}
              onChange={e => setForm({ ...form, commentaire: e.target.value })}
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-3 text-white text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button className="flex-1" onClick={save} loading={saving}>
              <Check className="w-4 h-4" />
              {editing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
