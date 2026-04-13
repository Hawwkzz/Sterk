import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileCheck, CheckCircle2, Circle, Upload, MapPin, User, Phone, Mail,
  Calendar, Building2, Send, XCircle, Euro, FileText, Trash2, ChevronDown,
  Download, Image, FileUp, Eye, Camera, File, Link2, AlertCircle
} from 'lucide-react'
import { useDossierCEE } from '../hooks/useEntreprise'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, Badge, Button, Spinner, Modal, Input, Textarea } from '../components/ui'
import { CEE_STATUT_CONFIG, CEE_STATUTS, CEE_DOCUMENT_TYPES, DELEGATAIRES } from '../lib/constants'
import { formatDate, formatCurrency } from '../lib/utils'
import { generateDossierCEEPDF, downloadPDF } from '../lib/pdf'
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
  const [docForm, setDocForm] = useState({ type_document: 'ATTESTATION_HONNEUR', nom: '', file: null })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(null)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [activeTab, setActiveTab] = useState('documents') // 'documents' | 'equipe'
  const fileInputRef = useRef(null)

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

  // Photos et documents de l'équipe (provenant du chantier)
  const equipePhotos = chantier?.photos || []
  const equipeDocuments = chantier?.documents || []
  const photosBefore = equipePhotos.filter(p => p.photo_type === 'before')
  const photosAfter = equipePhotos.filter(p => p.photo_type === 'after' || !p.photo_type)

  // IDs déjà importés dans le dossier CEE
  const importedSourceIds = new Set(documents.filter(d => d.source_id).map(d => d.source_id))

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
  const totalDocs = documents.length
  const validDocs = documents.filter(d => d.valide).length

  // ===== ACTIONS =====

  async function updateStatut(newStatut, extra = {}) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('dossiers_cee')
        .update({ statut: newStatut, updated_at: new Date().toISOString(), ...extra })
        .eq('id', dossier.id)

      if (error) throw error
      toast.success('Statut mis à jour')
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
      toast.success('Dossier mis à jour')
      setShowEditModal(false)
      refetch()
    } catch (err) {
      toast.error('Erreur: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Upload de fichier + création du document CEE
  async function addDocument() {
    if (!docForm.nom.trim()) {
      toast.error('Nom du document requis')
      return
    }

    setSaving(true)
    setUploading(true)
    try {
      let fileUrl = null

      // Upload du fichier si présent
      if (docForm.file) {
        const fileExt = docForm.file.name.split('.').pop()
        const filePath = `${dossier.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('documents-cee')
          .upload(filePath, docForm.file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('documents-cee')
          .getPublicUrl(filePath)

        fileUrl = publicUrl
      }

      const { error } = await supabase
        .from('documents_cee')
        .insert({
          dossier_id: dossier.id,
          type_document: docForm.type_document,
          nom: docForm.nom.trim(),
          url: fileUrl,
          valide: false,
          source: 'manual',
        })

      if (error) throw error
      toast.success('Document ajouté avec succès')
      setShowAddDocModal(false)
      setDocForm({ type_document: 'ATTESTATION_HONNEUR', nom: '', file: null })
      if (fileInputRef.current) fileInputRef.current.value = ''
      refetch()
    } catch (err) {
      toast.error('Erreur: ' + err.message)
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  // Importer une photo de l'équipe dans le dossier CEE
  async function importEquipePhoto(photo) {
    setImporting(photo.id)
    try {
      const typeDoc = photo.photo_type === 'before' ? 'PHOTO_AVANT' : 'PHOTO_APRES'
      const label = photo.photo_type === 'before' ? 'Photo avant' : 'Photo après'

      const { error } = await supabase
        .from('documents_cee')
        .insert({
          dossier_id: dossier.id,
          type_document: typeDoc,
          nom: `${label} — ${chantier.client_name}`,
          url: photo.url,
          valide: false,
          source: 'equipe_photo',
          source_id: photo.id,
        })

      if (error) throw error
      toast.success(`${label} importée dans le dossier`)
      refetch()
    } catch (err) {
      toast.error('Erreur: ' + err.message)
    } finally {
      setImporting(null)
    }
  }

  // Importer un document de l'équipe
  async function importEquipeDocument(doc) {
    setImporting(doc.id)
    try {
      const { error } = await supabase
        .from('documents_cee')
        .insert({
          dossier_id: dossier.id,
          type_document: 'AUTRE',
          nom: doc.filename || 'Document équipe',
          url: doc.url,
          valide: false,
          source: 'equipe_document',
          source_id: doc.id,
        })

      if (error) throw error
      toast.success('Document importé dans le dossier')
      refetch()
    } catch (err) {
      toast.error('Erreur: ' + err.message)
    } finally {
      setImporting(null)
    }
  }

  // Importer toutes les photos et documents de l'équipe d'un coup
  async function importAllEquipe() {
    setImporting('all')
    try {
      const inserts = []

      // Photos avant
      for (const photo of photosBefore) {
        if (importedSourceIds.has(photo.id)) continue
        inserts.push({
          dossier_id: dossier.id,
          type_document: 'PHOTO_AVANT',
          nom: `Photo avant — ${chantier.client_name}`,
          url: photo.url,
          valide: false,
          source: 'equipe_photo',
          source_id: photo.id,
        })
      }

      // Photos après
      for (const photo of photosAfter) {
        if (importedSourceIds.has(photo.id)) continue
        inserts.push({
          dossier_id: dossier.id,
          type_document: 'PHOTO_APRES',
          nom: `Photo après — ${chantier.client_name}`,
          url: photo.url,
          valide: false,
          source: 'equipe_photo',
          source_id: photo.id,
        })
      }

      // Documents
      for (const doc of equipeDocuments) {
        if (importedSourceIds.has(doc.id)) continue
        inserts.push({
          dossier_id: dossier.id,
          type_document: 'AUTRE',
          nom: doc.filename || 'Document équipe',
          url: doc.url,
          valide: false,
          source: 'equipe_document',
          source_id: doc.id,
        })
      }

      if (inserts.length === 0) {
        toast('Tout est déjà importé', { icon: '✓' })
        setImporting(null)
        return
      }

      const { error } = await supabase.from('documents_cee').insert(inserts)
      if (error) throw error

      toast.success(`${inserts.length} élément(s) importé(s)`)
      refetch()
    } catch (err) {
      toast.error('Erreur: ' + err.message)
    } finally {
      setImporting(null)
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
      toast.success('Document retiré')
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

  // Télécharger le dossier CEE complet en PDF
  async function handleDownloadPDF() {
    setDownloadingPDF(true)
    try {
      toast.loading('Génération du rapport CEE...', { id: 'cee-pdf' })
      const doc = await generateDossierCEEPDF(dossier, entreprise)
      downloadPDF(doc, `dossier-cee-${chantier?.client_name || dossier.id.slice(0, 8)}.pdf`)
      toast.success('Rapport CEE téléchargé', { id: 'cee-pdf' })
    } catch (err) {
      console.error('PDF error:', err)
      toast.error('Erreur lors de la génération du PDF', { id: 'cee-pdf' })
    } finally {
      setDownloadingPDF(false)
    }
  }

  const hasEquipeContent = equipePhotos.length > 0 || equipeDocuments.length > 0
  const notImportedCount = [...equipePhotos, ...equipeDocuments].filter(item => !importedSourceIds.has(item.id)).length

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
            {chantier?.client_name} — {chantier?.equipe?.name}
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
            <span className="text-zinc-500 text-xs">Réf: {dossier.reference_externe}</span>
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
        <h3 className="text-white font-semibold text-sm mb-3">Chantier associé</h3>
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
            <span>{chantier?.equipe?.name} — {chantier?.unit_count} unités</span>
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
            <span className="text-zinc-500">Délégataire</span>
            <span className="text-white">{dossier.delegataire || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Référence</span>
            <span className="text-white">{dossier.reference_externe || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Prime estimée</span>
            <span className="text-orange-400 font-medium">
              {dossier.montant_prime_estime ? formatCurrency(dossier.montant_prime_estime) : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Prime reçue</span>
            <span className="text-emerald-400 font-medium">
              {dossier.montant_prime_recu ? formatCurrency(dossier.montant_prime_recu) : '—'}
            </span>
          </div>
          {dossier.commentaire && (
            <div className="pt-2 border-t border-zinc-700/30">
              <p className="text-zinc-400 text-xs">{dossier.commentaire}</p>
            </div>
          )}
        </div>
      </Card>

      {/* === ONGLETS: Documents CEE / Contenu Équipe === */}
      <div className="flex gap-1 bg-zinc-800/50 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'documents'
              ? 'bg-orange-500 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Documents CEE ({validDocs}/{totalDocs})
        </button>
        <button
          onClick={() => setActiveTab('equipe')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors relative ${
            activeTab === 'equipe'
              ? 'bg-orange-500 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Contenu équipe
          {notImportedCount > 0 && activeTab !== 'equipe' && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
              {notImportedCount}
            </span>
          )}
        </button>
      </div>

      {/* === TAB: Documents CEE (checklist) === */}
      {activeTab === 'documents' && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">
              Documents ({validDocs}/{totalDocs})
            </h3>
            <Button size="sm" variant="ghost" onClick={() => setShowAddDocModal(true)}>
              <PlusIcon className="w-3 h-3" /> Ajouter
            </Button>
          </div>

          {/* Barre de complétude */}
          {totalDocs > 0 && (
            <div className="mb-4">
              <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    validDocs === totalDocs ? 'bg-emerald-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${(validDocs / totalDocs) * 100}%` }}
                />
              </div>
              <p className="text-zinc-500 text-[10px] mt-1">
                {validDocs === totalDocs ? 'Tous les documents sont validés' : `${totalDocs - validDocs} document(s) à valider`}
              </p>
            </div>
          )}

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

                  {/* Sous-documents */}
                  {docs.map(doc => (
                    <div key={doc.id} className="ml-6 flex items-center gap-2 py-1.5 text-xs group">
                      <button
                        onClick={() => toggleDocValide(doc)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          doc.valide ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 hover:border-zinc-400'
                        }`}
                      >
                        {doc.valide && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </button>
                      <span className={`flex-1 truncate ${doc.valide ? 'text-zinc-300' : 'text-zinc-500'}`}>{doc.nom}</span>

                      {/* Source badge */}
                      {doc.source === 'equipe_photo' && (
                        <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">équipe</span>
                      )}
                      {doc.source === 'equipe_document' && (
                        <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">équipe</span>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-orange-400"
                            onClick={e => e.stopPropagation()}
                          >
                            <Eye className="w-3 h-3" />
                          </a>
                        )}
                        <button onClick={() => deleteDocument(doc.id)} className="text-zinc-600 hover:text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* === TAB: Contenu Équipe (photos + documents du chantier) === */}
      {activeTab === 'equipe' && (
        <div className="space-y-4">
          {!hasEquipeContent ? (
            <Card className="p-6 text-center">
              <Camera className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm">Aucune photo ou document uploadé par l'équipe</p>
              <p className="text-zinc-600 text-xs mt-1">L'équipe doit uploader des photos et rapports depuis son interface</p>
            </Card>
          ) : (
            <>
              {/* Bouton importer tout */}
              {notImportedCount > 0 && (
                <Button
                  className="w-full"
                  variant="secondary"
                  size="sm"
                  onClick={importAllEquipe}
                  loading={importing === 'all'}
                >
                  <Download className="w-4 h-4" />
                  Tout importer dans le dossier CEE ({notImportedCount} élément{notImportedCount > 1 ? 's' : ''})
                </Button>
              )}

              {/* Photos AVANT */}
              {photosBefore.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-white font-semibold text-xs mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-400" />
                    Photos AVANT ({photosBefore.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {photosBefore.map(photo => {
                      const isImported = importedSourceIds.has(photo.id)
                      return (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.url}
                            alt="Photo avant"
                            className={`w-full aspect-square object-cover rounded-lg ${isImported ? 'opacity-50' : ''}`}
                          />
                          {isImported ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-emerald-500/90 text-white text-[10px] px-2 py-1 rounded-full font-medium">
                                Importée
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => importEquipePhoto(photo)}
                              disabled={importing === photo.id}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                            >
                              {importing === photo.id ? (
                                <Spinner size="sm" />
                              ) : (
                                <span className="bg-orange-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
                                  <Download className="w-3 h-3" /> Importer
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Photos APRÈS */}
              {photosAfter.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-white font-semibold text-xs mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    Photos APRÈS ({photosAfter.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {photosAfter.map(photo => {
                      const isImported = importedSourceIds.has(photo.id)
                      return (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.url}
                            alt="Photo après"
                            className={`w-full aspect-square object-cover rounded-lg ${isImported ? 'opacity-50' : ''}`}
                          />
                          {isImported ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-emerald-500/90 text-white text-[10px] px-2 py-1 rounded-full font-medium">
                                Importée
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => importEquipePhoto(photo)}
                              disabled={importing === photo.id}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                            >
                              {importing === photo.id ? (
                                <Spinner size="sm" />
                              ) : (
                                <span className="bg-orange-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
                                  <Download className="w-3 h-3" /> Importer
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Documents équipe */}
              {equipeDocuments.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-white font-semibold text-xs mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Rapports équipe ({equipeDocuments.length})
                  </h4>
                  <div className="space-y-2">
                    {equipeDocuments.map(doc => {
                      const isImported = importedSourceIds.has(doc.id)
                      return (
                        <div
                          key={doc.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            isImported
                              ? 'bg-emerald-500/5 border-emerald-500/20'
                              : 'bg-zinc-800 border-zinc-700/30 hover:border-orange-500/30'
                          }`}
                        >
                          <File className={`w-5 h-5 flex-shrink-0 ${isImported ? 'text-emerald-400' : 'text-blue-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{doc.filename || 'Document'}</p>
                            <p className="text-[10px] text-zinc-500">{doc.file_type || 'fichier'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-500 hover:text-white"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            {isImported ? (
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Importé</span>
                            ) : (
                              <button
                                onClick={() => importEquipeDocument(doc)}
                                disabled={importing === doc.id}
                                className="text-xs text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                              >
                                {importing === doc.id ? <Spinner size="sm" /> : <><Download className="w-3 h-3" /> Importer</>}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* === TÉLÉCHARGEMENT DOSSIER COMPLET === */}
      <Card className="p-4">
        <Button
          className="w-full"
          variant="secondary"
          onClick={handleDownloadPDF}
          loading={downloadingPDF}
        >
          <Download className="w-4 h-4" />
          Télécharger le rapport CEE complet (PDF)
        </Button>
        {totalDocs > 0 && documents.some(d => d.url) && (
          <p className="text-zinc-600 text-[10px] text-center mt-2">
            Inclut les infos chantier + {documents.filter(d => d.url).length} pièce(s) jointe(s)
          </p>
        )}
      </Card>

      {/* Actions de statut */}
      <div className="space-y-2 pb-4">
        {dossier.statut === CEE_STATUTS.A_COMPLETER && allRequiredPresent && (
          <Button className="w-full" onClick={() => updateStatut(CEE_STATUTS.PRET)} loading={saving}>
            Marquer comme prêt à envoyer
          </Button>
        )}

        {dossier.statut === CEE_STATUTS.PRET && (
          <Button className="w-full" onClick={() => updateStatut(CEE_STATUTS.ENVOYE, { date_envoi: new Date().toISOString().split('T')[0] })} loading={saving}>
            <Send className="w-4 h-4" /> Marquer comme envoyé
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
              <CheckCircle2 className="w-4 h-4" /> Validé
            </Button>
            <Button className="flex-1" variant="danger" onClick={() => updateStatut(CEE_STATUTS.REFUSE)} loading={saving}>
              <XCircle className="w-4 h-4" /> Refusé
            </Button>
          </div>
        )}

        {dossier.statut === CEE_STATUTS.VALIDE && (
          <Button className="w-full" onClick={() => {
            const montant = prompt('Montant de la prime reçue (€) :')
            if (montant) {
              updateStatut(CEE_STATUTS.PRIME_RECUE, {
                montant_prime_recu: parseFloat(montant),
                date_paiement: new Date().toISOString().split('T')[0],
              })
            }
          }} loading={saving}>
            <Euro className="w-4 h-4" /> Prime reçue
          </Button>
        )}

        {dossier.statut === CEE_STATUTS.REFUSE && (
          <Button className="w-full" variant="secondary" onClick={() => updateStatut(CEE_STATUTS.A_COMPLETER)} loading={saving}>
            Remettre à compléter
          </Button>
        )}
      </div>

      {/* Modal édition */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Modifier le dossier">
        <div className="p-6 space-y-4">
          <div>
            <label className="text-zinc-400 text-sm block mb-2">Délégataire</label>
            <select
              value={editForm.delegataire || ''}
              onChange={e => setEditForm({ ...editForm, delegataire: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500"
            >
              <option value="">Sélectionner...</option>
              {DELEGATAIRES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <Input
            label="Référence externe"
            value={editForm.reference_externe || ''}
            onChange={e => setEditForm({ ...editForm, reference_externe: e.target.value })}
            placeholder="N° dossier chez le délégataire"
          />
          <Input
            label="Prime estimée (€)"
            type="number"
            value={editForm.montant_prime_estime || ''}
            onChange={e => setEditForm({ ...editForm, montant_prime_estime: e.target.value })}
            placeholder="0.00"
          />
          <Input
            label="Prime reçue (€)"
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

      {/* Modal ajout document — AVEC UPLOAD FICHIER */}
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

          {/* UPLOAD FICHIER */}
          <div>
            <label className="text-zinc-400 text-sm block mb-2">Fichier (PDF, JPG, PNG)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                docForm.file
                  ? 'border-orange-500/50 bg-orange-500/5'
                  : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setDocForm({
                      ...docForm,
                      file,
                      nom: docForm.nom || file.name.replace(/\.[^/.]+$/, ''),
                    })
                  }
                }}
              />
              {docForm.file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileCheck className="w-5 h-5 text-orange-400" />
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">{docForm.file.name}</p>
                    <p className="text-zinc-500 text-xs">{(docForm.file.size / 1024 / 1024).toFixed(2)} Mo</p>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setDocForm({ ...docForm, file: null })
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="ml-2 text-zinc-500 hover:text-red-400"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                  <p className="text-zinc-400 text-sm">Cliquer pour sélectionner un fichier</p>
                  <p className="text-zinc-600 text-xs mt-1">PDF, JPG, PNG, DOCX — max 50 Mo</p>
                </>
              )}
            </div>
          </div>

          <Button className="w-full" onClick={addDocument} loading={saving || uploading}>
            {uploading ? 'Upload en cours...' : 'Ajouter le document'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function PlusIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
