import { useState, useRef } from 'react'
import { Euro, Target, Check, Settings, Upload, Shield, Calendar, Trash2, FileText, AlertCircle } from 'lucide-react'
import { useEntrepriseParamsPrimes } from '../hooks/useEntreprise'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, Spinner } from '../components/ui'
import { isDemoMode } from '../lib/demoMode'
import toast from 'react-hot-toast'

const SECTEUR_ICONS = { led: '💡', pac: '🌡️', pv: '☀️', irve: '⚡' }

const RGE_ORGANISMES = [
  'Qualibat',
  'QualiPAC',
  'QualiSol',
  'QualiPV',
  'Qualifelec',
  'Certibat',
  "Qualit'EnR",
  'Autre',
]

export default function EntrepriseParametresPage() {
  const { secteurs, loading, saving, saveParam, getEffectiveValues } = useEntrepriseParamsPrimes()
  const { entreprise } = useAuth()
  const [editValues, setEditValues] = useState({})
  const [savedRows, setSavedRows] = useState({})
  const [activeTab, setActiveTab] = useState('primes')

  // RGE state
  const [rgeNumero, setRgeNumero] = useState(entreprise?.rge_numero || '')
  const [rgeOrganisme, setRgeOrganisme] = useState(entreprise?.rge_organisme || '')
  const [rgeDateExpiration, setRgeDateExpiration] = useState(entreprise?.rge_date_expiration || '')
  const [rgeFile, setRgeFile] = useState(null)
  const [rgeSaving, setRgeSaving] = useState(false)
  const [rgeUploading, setRgeUploading] = useState(false)
  const rgeFileRef = useRef(null)

  if (loading) return (
    <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
  )

  // === PRIMES HANDLERS ===

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

  // === RGE HANDLERS ===

  async function handleSaveRGE() {
    if (isDemoMode()) {
      toast.success('Mode démo — sauvegarde simulée')
      return
    }
    if (!entreprise?.id) return

    setRgeSaving(true)
    try {
      let certificateUrl = entreprise.rge_certificate_url || null

      if (rgeFile) {
        setRgeUploading(true)
        const fileExt = rgeFile.name.split('.').pop()
        const filePath = `${entreprise.id}/rge_certificate_${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('documents-cee')
          .upload(filePath, rgeFile, { cacheControl: '3600', upsert: false })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('documents-cee')
          .getPublicUrl(filePath)

        certificateUrl = publicUrl
        setRgeUploading(false)
      }

      const { error } = await supabase
        .from('entreprises')
        .update({
          rge_numero: rgeNumero.trim() || null,
          rge_organisme: rgeOrganisme || null,
          rge_date_expiration: rgeDateExpiration || null,
          rge_certificate_url: certificateUrl,
          rge_updated_at: new Date().toISOString(),
        })
        .eq('id', entreprise.id)

      if (error) throw error

      entreprise.rge_numero = rgeNumero.trim() || null
      entreprise.rge_organisme = rgeOrganisme || null
      entreprise.rge_date_expiration = rgeDateExpiration || null
      entreprise.rge_certificate_url = certificateUrl

      setRgeFile(null)
      if (rgeFileRef.current) rgeFileRef.current.value = ''
      toast.success('Informations RGE enregistrées')
    } catch (err) {
      console.error('RGE save error:', err)
      toast.error('Erreur: ' + err.message)
    } finally {
      setRgeSaving(false)
      setRgeUploading(false)
    }
  }

  async function handleDeleteRGECertificate() {
    if (isDemoMode() || !entreprise?.id) return
    setRgeSaving(true)
    try {
      const { error } = await supabase
        .from('entreprises')
        .update({ rge_certificate_url: null, rge_updated_at: new Date().toISOString() })
        .eq('id', entreprise.id)
      if (error) throw error
      entreprise.rge_certificate_url = null
      toast.success('Certificat RGE supprimé')
    } catch (err) {
      toast.error('Erreur: ' + err.message)
    } finally {
      setRgeSaving(false)
    }
  }

  const rgeExpired = rgeDateExpiration && new Date(rgeDateExpiration) < new Date()

  return (
    <div className="py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-orange-400" />
          Paramètres
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Configuration des primes et qualification RGE de votre entreprise.
        </p>
      </div>

      {isDemoMode() && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <p className="text-blue-300 text-sm">Mode démo — les modifications ne sont pas sauvegardées.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('primes')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'primes'
              ? 'bg-orange-500 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <Euro className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Primes
        </button>
        <button
          onClick={() => setActiveTab('rge')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'rge'
              ? 'bg-orange-500 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Qualification RGE
        </button>
      </div>

      {/* === TAB PRIMES === */}
      {activeTab === 'primes' && (
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
      )}

      {/* === TAB RGE === */}
      {activeTab === 'rge' && (
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-white font-semibold">Qualification RGE</h2>
            </div>

            <p className="text-zinc-500 text-sm">
              Le justificatif RGE est automatiquement inclus dans chaque dossier CEE exporté.
            </p>

            {/* Numéro RGE */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">Numéro de qualification RGE</label>
              <input
                type="text"
                value={rgeNumero}
                onChange={e => setRgeNumero(e.target.value)}
                placeholder="Ex: E-12345"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Organisme */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">Organisme de qualification</label>
              <select
                value={rgeOrganisme}
                onChange={e => setRgeOrganisme(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
              >
                <option value="">Sélectionner...</option>
                {RGE_ORGANISMES.map(org => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </div>

            {/* Date d'expiration */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date d'expiration
              </label>
              <input
                type="date"
                value={rgeDateExpiration}
                onChange={e => setRgeDateExpiration(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
              />
              {rgeExpired && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  <span className="text-red-400 text-xs">Qualification expirée — pensez à la renouveler.</span>
                </div>
              )}
            </div>

            {/* Upload certificat */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">Certificat RGE (PDF, JPG, PNG)</label>

              {entreprise?.rge_certificate_url && !rgeFile ? (
                <div className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <a
                    href={entreprise.rge_certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 text-sm hover:underline truncate flex-1"
                  >
                    Certificat uploadé
                  </a>
                  <button
                    onClick={handleDeleteRGECertificate}
                    className="text-zinc-500 hover:text-red-400 transition-colors"
                    title="Supprimer le certificat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => rgeFileRef.current?.click()}
                  className="border-2 border-dashed border-zinc-700 hover:border-orange-500/50 rounded-lg p-4 text-center cursor-pointer transition-colors"
                >
                  <Upload className="w-6 h-6 text-zinc-500 mx-auto mb-1" />
                  <p className="text-zinc-400 text-sm">
                    {rgeFile ? rgeFile.name : 'Cliquez pour sélectionner le certificat'}
                  </p>
                  <input
                    ref={rgeFileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={e => setRgeFile(e.target.files?.[0] || null)}
                  />
                </div>
              )}
            </div>

            {/* Bouton sauvegarder */}
            <button
              onClick={handleSaveRGE}
              disabled={rgeSaving}
              className="w-full py-2.5 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {rgeSaving ? (
                <><Spinner size="sm" /> {rgeUploading ? 'Upload en cours...' : 'Sauvegarde...'}</>
              ) : (
                <><Check className="w-4 h-4" /> Enregistrer les informations RGE</>
              )}
            </button>
          </Card>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <p className="text-emerald-300 text-sm">
              Le certificat RGE sera automatiquement ajouté à chaque dossier CEE lors de l'export ZIP.
              Le numéro RGE apparaîtra aussi sur l'attestation sur l'honneur.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
