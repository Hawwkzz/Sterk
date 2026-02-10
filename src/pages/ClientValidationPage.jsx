import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Zap, MapPin, Calendar, User, CheckCircle, XCircle, Camera, X, AlertTriangle, Clock, Loader2, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDate, formatNumber } from '../lib/utils'
import { STATUTS } from '../lib/constants'
import { Button, Input, Textarea, Card } from '../components/ui'
import toast, { Toaster } from 'react-hot-toast'

export default function ClientValidationPage() {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [chantier, setChantier] = useState(null)
  const [error, setError] = useState(null)
  const [completed, setCompleted] = useState(false)
  const [showRefusForm, setShowRefusForm] = useState(false)
  
  // Refus form
  const [refusComment, setRefusComment] = useState('')
  const [refusPhotos, setRefusPhotos] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    async function loadChantier() {
      try {
        if (!token) {
          setError('Lien invalide')
          return
        }

        // Chercher le chantier par token
        const { data, error: fetchError } = await supabase
          .from('chantiers')
          .select(`
            *,
            equipe:equipes(name),
            photos:chantier_photos(id, url, photo_type),
            documents:chantier_documents(id, url, filename, file_type)
          `)
          .eq('validation_token', token)
          .single()

        if (fetchError || !data) {
          setError('Ce lien de validation n\'existe pas ou a expiré')
          return
        }

        // Vérifier expiration
        if (new Date(data.validation_expires_at) < new Date()) {
          setError('Ce lien de validation a expiré. Veuillez contacter l\'équipe.')
          return
        }

        // Vérifier si déjà traité
        if (data.status === STATUTS.VALIDE) {
          setCompleted(true)
          setChantier(data)
          return
        }

        if (data.status === STATUTS.REFUSE) {
          setError('Ce chantier a déjà été refusé.')
          return
        }

        setChantier(data)
      } catch (err) {
        console.error('Load error:', err)
        setError('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    loadChantier()
  }, [token])

  function handlePhotoSelect(e) {
    const files = Array.from(e.target.files)
    if (files.length + refusPhotos.length > 4) {
      toast.error('Maximum 4 photos')
      return
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} dépasse 5MB`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setRefusPhotos(prev => [...prev, {
          file,
          preview: e.target.result,
          id: Math.random().toString(36).substring(7)
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  function removePhoto(id) {
    setRefusPhotos(prev => prev.filter(p => p.id !== id))
  }

  async function handleValidate() {
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('chantiers')
        .update({
          status: STATUTS.VALIDE,
          validated_at: new Date().toISOString(),
        })
        .eq('id', chantier.id)

      if (error) throw error

      setCompleted(true)
      toast.success('Intervention validée avec succès !')
    } catch (err) {
      console.error('Validation error:', err)
      toast.error('Erreur lors de la validation')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRefuse() {
    if (!refusComment.trim()) {
      toast.error('Veuillez saisir un commentaire')
      return
    }

    if (refusPhotos.length === 0) {
      toast.error('Veuillez ajouter au moins une photo')
      return
    }

    setSubmitting(true)
    try {
      // Mettre à jour le statut
      const { error: updateError } = await supabase
        .from('chantiers')
        .update({ status: STATUTS.REFUSE })
        .eq('id', chantier.id)

      if (updateError) throw updateError

      // Créer l'entrée de refus
      const { data: refusData, error: refusError } = await supabase
        .from('chantier_refus')
        .insert({
          chantier_id: chantier.id,
          commentaire: refusComment,
        })
        .select()
        .single()

      if (refusError) throw refusError

      // Upload des photos
      for (const photo of refusPhotos) {
        const fileExt = photo.file.name.split('.').pop()
        const fileName = `refus/${chantier.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('chantier-photos')
          .upload(fileName, photo.file)

        if (uploadError) continue

        const { data: { publicUrl } } = supabase.storage
          .from('chantier-photos')
          .getPublicUrl(fileName)

        await supabase.from('refus_photos').insert({
          refus_id: refusData.id,
          url: publicUrl,
        })
      }

      setCompleted(true)
      toast.success('Refus enregistré')
    } catch (err) {
      console.error('Refus error:', err)
      toast.error('Erreur lors du refus')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Chargement...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Lien invalide</h1>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    )
  }

  // Completed state
  if (completed) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <Toaster position="top-center" />
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Merci !</h1>
          <p className="text-zinc-400 mb-6">
            Votre réponse a été enregistrée. L'équipe EOIA Energie vous remercie pour votre confiance.
          </p>
          
          {chantier && (
            <Card className="p-4 text-left">
              <p className="text-zinc-500 text-xs mb-1">Intervention</p>
              <p className="text-white">{chantier.adresse}</p>
              <p className="text-orange-400 font-bold mt-2">{formatNumber(chantier.led_count)} LED installées</p>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // Séparer les photos avant et après
  const photosBefore = chantier.photos?.filter(p => p.photo_type === 'before') || []
  const photosAfter = chantier.photos?.filter(p => p.photo_type === 'after' || !p.photo_type) || []

  return (
    <div className="min-h-screen bg-zinc-950">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 to-amber-600 px-6 py-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">EOIA Energie</h1>
        <p className="text-orange-100 mt-1">Validation d'intervention LED</p>
      </div>

      <div className="px-6 py-8 max-w-md mx-auto space-y-6">
        {/* Chantier info */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{formatNumber(chantier.led_count)}</p>
              <p className="text-orange-400 text-sm font-medium">LED installées</p>
            </div>
          </div>

          <hr className="border-zinc-700/50" />

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-zinc-500 mt-0.5" />
              <div>
                <p className="text-zinc-500 text-xs">Adresse</p>
                <p className="text-white">{chantier.adresse}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-zinc-500 mt-0.5" />
              <div>
                <p className="text-zinc-500 text-xs">Date d'intervention</p>
                <p className="text-white">{formatDate(chantier.date_intervention)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-zinc-500 mt-0.5" />
              <div>
                <p className="text-zinc-500 text-xs">Équipe</p>
                <p className="text-white">{chantier.equipe?.name}</p>
              </div>
            </div>
          </div>
        </Card>

{/* Photos AVANT */}
        {photosBefore.length > 0 && (
          <Card className="p-5">
            <p className="text-white font-medium mb-3">📷 Photos AVANT intervention</p>
            <div className="grid grid-cols-3 gap-2">
              {photosBefore.map(photo => (
                
                  key={photo.id}
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-lg overflow-hidden bg-zinc-800"
                >
                  <img
                    src={photo.url}
                    alt="Photo avant"
                    className="w-full h-full object-cover"
                  />
                </a>
              ))}
            </div>
          </Card>
        )}

        {/* Photos APRÈS */}
        {photosAfter.length > 0 && (
          <Card className="p-5">
            <p className="text-white font-medium mb-3">📷 Photos APRÈS intervention</p>
            <div className="grid grid-cols-3 gap-2">
              {photosAfter.map(photo => (
                
                  key={photo.id}
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-lg overflow-hidden bg-zinc-800"
                >
                  <img
                    src={photo.url}
                    alt="Photo après"
                    className="w-full h-full object-cover"
                  />
                </a>
              ))}
            </div>
          </Card>
        )}
        {/* Documents */}
        {chantier.documents && chantier.documents.length > 0 && (
          <Card className="p-5">
            <p className="text-white font-medium mb-3">📄 Documents joints</p>
            <div className="space-y-2">
              {chantier.documents.map(doc => (
                
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-zinc-800 rounded-lg p-3 hover:bg-zinc-700 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-sm text-zinc-300 flex-1 truncate">
                    {doc.filename || 'Document'}
                  </span>
                </a>
              ))}
            </div>
          </Card>
        )}

        {/* Refus form */}
        {showRefusForm ? (
          <Card className="p-5 border-red-500/30 bg-red-500/5">
            <h3 className="text-lg font-semibold text-white mb-4">Motif du refus</h3>
            
            <Textarea
              placeholder="Décrivez le problème constaté..."
              rows={4}
              value={refusComment}
              onChange={(e) => setRefusComment(e.target.value)}
              className="mb-4"
            />

            <div className="mb-4">
              <p className="text-zinc-400 text-sm mb-2">Photos justificatives *</p>
              <div className="grid grid-cols-4 gap-2">
                {refusPhotos.map(photo => (
                  <div key={photo.id} className="relative aspect-square">
                    <img
                      src={photo.preview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {refusPhotos.length < 4 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square bg-zinc-800 border-2 border-dashed border-zinc-600 rounded-lg flex flex-col items-center justify-center hover:border-red-500"
                  >
                    <Camera className="w-5 h-5 text-zinc-500" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowRefusForm(false)}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                loading={submitting}
                onClick={handleRefuse}
              >
                Confirmer le refus
              </Button>
            </div>
          </Card>
        ) : (
          /* Action buttons */
          <div className="space-y-3">
            <Button
              onClick={handleValidate}
              loading={submitting}
              className="w-full"
              size="lg"
            >
              <CheckCircle className="w-5 h-5" />
              Valider l'intervention
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowRefusForm(true)}
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              size="lg"
            >
              <XCircle className="w-5 h-5" />
              Signaler un problème
            </Button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-zinc-600 text-xs pt-4">
          Ce lien expire dans 72h.<br />
          En cas de problème, contactez EOIA Energie.
        </p>
      </div>
    </div>
  )
}
