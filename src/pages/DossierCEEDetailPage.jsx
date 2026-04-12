import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileCheck, CheckCircle2, Circle, Upload, MapPin, User, Phone, Mail,
  Calendar, Building2, Send, XCircle, Euro, FileText, Trash2, ChevronDown
} from 'lucide-react'
import { useDossierCEE } from '../hooks/useEntreprise'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, Badge, Button, Spinner, Modal, Input, Textarea } from '../components/ui'
import { CEE_STATUT_CONFIG, CEE_STATUTS, CEE_DOCUMENT_TYPES, DELEGATAIRES } from '../lib/constants'
import { formatDate, formatCurrency } from '../lib/utils'
import toast from 'react-hot-toast'

const STATUT_FLOW = [
  CEE_STATUTS.A_COMPLETER,
  CEE_STATUTS.PRET,
  CEE_STATUTS.ENVOYE,
  CEE_STATUTS.EN_TRAITEMENT,
  CEE_STATUTS.VALIDE,
  CEE_STATUTS.PRIME_RECUE,
]

export default function DossierCEEDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { entreprise } = useAuth()
  const { dossier, loading, refetch } = useDossierCEE(id)

  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddDocModal, setShowAddDocModal] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [docForm, setDocForm] = useState({ type_document: 'ATTESTATION_HONNEUR', nom: '' })
  const [saving, setSaving] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!dossier) {
    return (
      <div className="py-6 text-center">
        <p className="text-zinc-400">Dossier introuvable</p>
        <Button variant="ghost" onClick={() => navigate('/entreprise/dossiers')} className="mt-4">
          Retour
        </Button>
      </div>
    )
  }

  const chantier = dossier.chantier
  const documents = dossier.documents || []
  const config = CEE_STATUT_CONFIG[dossier.statut] || {}

  // Progression dans le flow
  const currentStep = STATUT_FLOW.indexOf(dossier.statut)

  // Checklist documents requis
  const requiredTypes = Object.entries(CEE_DOCUMENT_TYPES)
    .filter(([_, cfg]) => cfg.required)
    .map(([type]) => type)

  const docsParType = {}
  documents.forEach(d => {
    if (!docsParType[d.type_document]) docsParType[d.type_document] = []
    docsParType[d.type_document].push(d)
  })

  const allRequiredPresent = requiredTypes.every(type => docsParType[type]?.length > 0)

  // Actions
  async function updateStatut(newStatut, extra = {}) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('dossiers_cee')
        .update({ statut: newStatut, updated_at: new Date().toISOString(), ...extra })
        .eq('id', dossier.id)

      if (error) throw error
      toast.success('Statut mis Ã  jour')
      refetch()
    } catch (err) {
      toast.error('Erreur: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('dossiers_cee')
        .update({
          delegataire: editForm.delegataire || dossier.delegataire,
          reference_externe: editForm.reference_externe || dossier.reference_externe,
          montant_prime_estime: editForm.montant_prime_estime || dossier.montant_prime_estime,
          montant_prime_recu: editForm.montant_prime_recu || dossier.montant_prime_recu,
          commentaire: editForm.commentaire ?? dossier.commentaire,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dossier.id)

      if (error) throw error
      toast.success('Dossier mis Ã  jour')
      setShowEditModal(false)
      refetch()
    } catch (err) {
      toast.error('Erreur: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function addDocument() {
    if (!docForm.nom.trim()) {
      toast.error('Nom du document requis')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('documents_cee')
        .insert({
          dossier_id: dossier.id,
          type_document: docForm.type_document,
          nom: docForm.nom.trim(),
          valide: false,
        })

      if (error) throw error
      toast.success('Document ajoutÃ©')
      setShowAddDocModal(false)
      setDocForm({ type_document: 'ATTESTATION_HONNEUR', nom: '' })
      refetch()
    } catch (err) {
      toast.error('Erreur: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleDocValide(doc) {
    try {
      const { error } = await supabase
        .from('documents_cee')
        .update({ valide: !doc.valide })
        .eq('id', doc.id)

      if (error) throw error
      refetch()
    } catch (err) {
      toast.error('Erreur')
    }
  }

  async function deleteDocument(docId) {
    try {
      const { error } = await supabase
        .from('documents_cee')
        .delete()
        .eq('id', docId)

      if (error) throw error
      toast.success('Document supprimÃ©')
      refetch()
    } catch (err) {
      toast.error('Erreur')
    }
  }

  function openEditModal() {
    setEditForm({
      delegataire: dossier.delegataire || '',
      reference_externe: dossier.reference_externe || '',
      montant_prime_estime: dossier.montant_prime_estime || '',
      montant_prime_recu: dossier.montant_prime_recu || '',
      commentaire: dossier.commentaire || '',
    })
    setShowEditModal(true)
  }

  return (
    <div className="py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/entreprise/dossiers')}
          className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">Dossier CEE</h1>
          <p className="text-zinc-500 text-xs">
            {chantier?.client_name} â {chantier?.equipe?.name}
          </p>
        </div>
      </div>

      {/* Progression statut */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge variant={
            config.color === 'emerald' ? 'success'
            : config.color === 'red' ? 'danger'
            : config.color === 'amber' ? 'warning'
            : 'info'
          }>
            {config.label || dossier.statut}
          </Badge>
          {dossier.reference_externe && (
            <span className="text-zinc-500 text-xs">RÃ©f: {dossier.reference_externe}</span>
          )}
        </div>

        {/* Steps */}
        <div className="flex items-center gap-1">
          {STATUT_FLOW.map((step, i) => {
            const stepConfig = CEE_STATUT_CONFIG[step]
            const isActive = i <= currentStep
            const isCurrent = step === dossier.statut
            return (
              <div key={step} className="flex-1 flex flex-col items-center">
                <div className={`h-1.5 w-full rounded-full ${isActive ? 'bg-orange-500' : 'bg-zinc-700'}`} />
                {isCurrent && (
                  <span className="text-[10px] text-orange-400 mt-1 whitespace-nowrap">
                    {stepConfig.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Infos chantier */}
      <Card className="p-4">
        <h3 className="text-white font-semibold text-sm mb-3">Chantier associÃ©</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-zinc-400">
            <User className="w-4 h-4 text-zinc-500" />
            <span>{chantier?.client_name}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <MapPin className="w-4 h-4 text-zinc-500" />
            <span>{chantier?.adresse}</span>
          </div>
          {chantier?.client_email && (
            <div className="flex items-center gap-2 text-zinc-400">
              <Mail className="w-4 h-4 text-zinc-500" />
              <span>{chantier?.client_email}</span>
            </div>
          )}
          {chantier?.client_phone && (
            <div className="flex items-center gap-2 text-zinc-400">
              <Phone className="w-4 h-4 text-zinc-500" />
              <span>{chantier?.client_phone}</span>
            </div>
          )}
          {chantier?.date_intervention && (
            <div className="flex items-center gap-2 text-zinc-400">
              <Calendar className="w-4 h-4 text-zinc-500" />
              <span>{formatDate(chantier.date_intervention)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-zinc-400">
            <Building2 className="w-4 h-4 text-zinc-500" />
            <span>{chantier?.equipe?.name} â {chantier?.unit_count} unitÃ©s</span>
          </div>
        </div>
      </Card>

      {/* Infos dossier */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">Informations dossier</h3>
          <Button size="sm" variant="ghost" onClick={openEditModal}>Modifier</Button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">DÃ©lÃ©gataire</span>
            <span className="text-white">{dossier.delegataire || 'â'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">RÃ©fÃ©rence</span>
            <span className="text-white">{dossier.reference_externe || 'â'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Prime estimÃ©e</span>
            <span className="text-orange-400 font-medium">
              {dossier.montant_prime_estime ? formatCurrency(dossier.montant_prime_estime) : 'â'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Prime reÃ§ue</span>
            <span className="text-emerald-400 font-medium">
              {dossier.montant_prime_recu ? formatCurrency(dossier.montant_prime_recu) : 'â'}
            </span>
          </div>
          {dossier.commentaire && (
            <div className="pt-2 border-t border-zinc-700/30">
              <p className="text-zinc-400 text-xs">{dossier.commentaire}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Checklist documents */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">
            Documents ({documents.filter(d => d.valide).length}/{documents.length})
          </h3>
          <Button size="sm" variant="ghost" onClick={() => setShowAddDocModal(true)}>
            <Plus className="w-3 h-3" /> Ajouter
          </Button>
        </div>

        {/* Documents requis */}
        <div className="space-y-1.5">
          {Object.entries(CEE_DOCUMENT_TYPES).map(([type, typeCfg]) => {
            const docs = docsParType[type] || []
            const hasDoc = docs.length > 0
            const allValide = docs.length > 0 && docs.every(d => d.valide)

            return (
              <div key={type}>
                <div className="flex items-center gap-2 py-1.5">
                  {allValide ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className={`w-4 h-4 flex-shrink-0 ${typeCfg.required ? 'text-amber-500' : 'text-zinc-600'}`} />
                  )}
                  <span className={`text-xs flex-1 ${allValide ? 'text-emerald-400' : hasDoc ? 'text-white' : typeCfg.required ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {typeCfg.label}
                    {typeCfg.required && !hasDoc && <span className="text-red-400 ml-1">*</span>}
                  </span>
                </div>

                {/* Sous-documents uploadÃ©s */}
                {docs.map(doc => (
                  <div key={doc.id} className="ml-6 flex items-center gap-2 py-1 text-xs">
                    <button
                      onClick={() => toggleDocValide(doc)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        doc.valide ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 hover:border-zinc-400'
                      }`}
                    >
                      {doc.valide && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>
                    <span className={doc.valide ? 'text-zinc-300' : 'text-zinc-500'}>{doc.nom}</span>
                    <button onClick={() => deleteDocument(doc.id)} className="ml-auto text-zinc-600 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Actions */}
      <div className="space-y-2 pb-4">
        {dossier.statut === CEE_STATUTS.A_COMPLETER && allRequiredPresent && (
          <Button className="w-full" onClick={() => updateStatut(CEE_STATUTS.PRET)} loading={saving}>
            Marquer comme prÃªt Ã  envoyer
          </Button>
        )}

        {dossier.statut === CEE_STATUTS.PRET && (
          <Button className="w-full" onClick={() => updateStatut(CEE_STATUTS.ENVOYE, { date_envoi: new Date().toISOString().split('T')[0] })} loading={saving}>
            <Send className="w-4 h-4" /> Marquer comme envoyÃ©
          </Button>
        )}

        {dossier.statut === CEE_STATUTS.ENVOYE && (
          <Button className="w-full" onClick={() => updateStatut(CEE_STATUTS.EN_TRAITEMENT)} loading={saving}>
            En cours de traitement
          </Button>
        )}

        {dossier.statut === CEE_STATUTS.EN_TRAITEMENT && (
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => updateStatut(CEE_STATUTS.VALIDE, { date_validation: new Date().toISOString().split('T')[0] })} loading={saving}>
              <CheckCircle2 className="w-4 h-4" /> ValidÃ©
            </Button>
            <Button className="flex-1" variant="danger" onClick={() => updateStatut(CEE_STATUTS.REFUSE)} loading={saving}>
              <XCircle className="w-4 h-4" /> RefusÃ©
            </Button>
          </div>
        )}

        {dossier.statut === CEE_STATUTS.VALIDE && (
          <Button className="w-full" onClick={() => {
            const montant = prompt('Montant de la prime reÃ§ue (â¬) :')
            if (montant) {
              updateStatut(CEE_STATUTS.PRIME_RECUE, {
                montant_prime_recu: parseFloat(montant),
                date_paiement: new Date().toISOString().split('T')[0],
              })
            }
          }} loading={saving}>
            <Euro className="w-4 h-4" /> Prime reÃ§ue
          </Button>
        )}

        {dossier.statut === CEE_STATUTS.REFUSE && (
          <Button className="w-full" variant="secondary" onClick={() => updateStatut(CEE_STATUTS.A_COMPLETER)} loading={saving}>
            Remettre Ã  complÃ©ter
          </Button>
        )}
      </div>

      {/* Modal Ã©dition */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Modifier le dossier">
        <div className="p-6 space-y-4">
          <div>
            <label className="text-zinc-400 text-sm block mb-2">DÃ©lÃ©gataire</label>
            <select
              value={editForm.delegataire || ''}
              onChange={e => setEditForm({ ...editForm, delegataire: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500"
            >
              <option value="">SÃ©lectionner...</option>
              {DELEGATAIRES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <Input
            label="RÃ©fÃ©rence externe"
            value={editForm.reference_externe || ''}
            onChange={e => setEditForm({ ...editForm, reference_externe: e.target.value })}
            placeholder="NÂ° dossier chez le dÃ©lÃ©gataire"
          />
          <Input
            label="Prime estimÃ©e (â¬)"
            type="number"
            value={editForm.montant_prime_estime || ''}
            onChange={e => setEditForm({ ...editForm, montant_prime_estime: e.target.value })}
            placeholder="0.00"
          />
          <Input
            label="Prime reÃ§ue (â¬)"
            type="number"
            value={editForm.montant_prime_recu || ''}
            onChange={e => setEditForm({ ...editForm, montant_prime_recu: e.target.value })}
            placeholder="0.00"
          />
          <Textarea
            label="Commentaire"
            value={editForm.commentaire || ''}
            onChange={e => setEditForm({ ...editForm, commentaire: e.target.value })}
            rows={3}
          />
          <Button className="w-full" onClick={saveEdit} loading={saving}>
            Enregistrer
          </Button>
        </div>
      </Modal>

      {/* Modal ajout document */}
      <Modal open={showAddDocModal} onClose={() => setShowAddDocModal(false)} title="Ajouter un document">
        <div className="p-6 space-y-4">
          <div>
            <label className="text-zinc-400 text-sm block mb-2">Type de document</label>
            <select
              value={docForm.type_document}
              onChange={e => setDocForm({ ...docForm, type_document: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500"
            >
              {Object.entries(CEE_DOCUMENT_TYPES).map(([type, cfg]) => (
                <option key={type} value={type}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <Input
            label="Nom du document"
            value={docForm.nom}
            onChange={e => setDocForm({ ...docForm, nom: e.target.value })}
            placeholder="Ex: Attestation M. Dupont"
          />
          <Button className="w-full" onClick={addDocument} loading={saving}>
            Ajouter
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function Plus({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

