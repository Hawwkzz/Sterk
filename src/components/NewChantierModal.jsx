import { useState, useRef } from 'react'
import { MapPin, Zap, User, Mail, Phone, Camera, X, Send, Save, FileText, Upload } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { generateSecureToken, isValidEmail, isValidPhone } from '../lib/utils'
import { STATUTS } from '../lib/constants'
import { Modal, Button, Input, Textarea } from './ui'
import toast from 'react-hot-toast'

export default function NewChantierModal({ open, onClose, onSuccess }) {
  const { equipe } = useAuth()
  const fileInputBeforeRef = useRef(null)
  const fileInputAfterRef = useRef(null)
  const docInputRef = useRef(null)
  
  const [loading, setLoading] = useState(false)
  const [photosBefore, setPhotosBefore] = useState([])
  const [photosAfter, setPhotosAfter] = useState([])
  const [documents, setDocuments] = useState([])
  const [formData, setFormData] = useState({
    adresse: '',
    led_count: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    commentaire: '',
  })
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  function handlePhotoSelect(e, type) {
    const files = Array.from(e.target.files)
    const currentPhotos = type === 'before' ? photosBefore : photosAfter
    const setPhotos = type === 'before' ? setPhotosBefore : setPhotosAfter
    
    if (files.length + currentPhotos.length > 6) {
      toast.error('Maximum 6 photos par catégorie')
      return
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} dépasse 5MB`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotos(prev => [...prev, {
          file,
          preview: e.target.result,
          id: Math.random().toString(36).substring(7)
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  function handleDocSelect(e) {
    const files = Array.from(e.target.files)
    
    if (files.length + documents.length > 5) {
      toast.error('Maximum 5 documents')
      return
    }

    files.forEach(file => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} dépasse 10MB`)
        return
      }

      setDocuments(prev => [...prev, {
        file,
        name: file.name,
        type: file.type,
        id: Math.random().toString(36).substring(7)
      }])
    })
  }

  function removePhoto(id, type) {
    if (type === 'before') {
      setPhotosBefore(prev => prev.filter(p => p.id !== id))
    } else {
      setPhotosAfter(prev => prev.filter(p => p.id !== id))
    }
  }

  function removeDocument(id) {
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  function validate() {
    const newErrors = {}
    
    if (!formData.adresse.trim()) {
      newErrors.adresse = 'Adresse requise'
    }
    
    if (!formData.led_count || parseInt(formData.led_count) <= 0) {
      newErrors.led_count = 'Nombre de LED requis'
    }
    
    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Nom du client requis'
    }
    
    if (!formData.client_email.trim() && !formData.client_phone.trim()) {
      newErrors.client_email = 'Email ou téléphone requis'
      newErrors.client_phone = 'Email ou téléphone requis'
    } else {
      if (formData.client_email && !isValidEmail(formData.client_email)) {
        newErrors.client_email = 'Email invalide'
      }
      if (formData.client_phone && !isValidPhone(formData.client_phone)) {
        newErrors.client_phone = 'Téléphone invalide'
      }
    }
    
    if (photosAfter.length < 1) {
      toast.error('Au moins 1 photo "après" requise')
      return false
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function uploadPhotos(chantierId) {
    const allPhotos = [
      ...photosBefore.map(p => ({ ...p, type: 'before' })),
      ...photosAfter.map(p => ({ ...p, type: 'after' }))
    ]
    const uploadedPhotos = []
    
    for (const photo of allPhotos) {
      const fileExt = photo.file.name.split('.').pop()
      const fileName = `${chantierId}/${photo.type}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('chantier-photos')
        .upload(fileName, photo.file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chantier-photos')
        .getPublicUrl(fileName)

      uploadedPhotos.push({ url: publicUrl, type: photo.type })
    }

    return uploadedPhotos
  }

  async function uploadDocuments(chantierId) {
    const uploadedDocs = []
    
    for (const doc of documents) {
      const fileExt = doc.file.name.split('.').pop()
      const fileName = `${chantierId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('chantier-documents')
        .upload(fileName, doc.file)

      if (uploadError) {
        console.error('Upload doc error:', uploadError)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chantier-documents')
        .getPublicUrl(fileName)

      uploadedDocs.push({ 
        url: publicUrl, 
        filename: doc.name,
        file_type: doc.type 
      })
    }

    return uploadedDocs
  }

  async function handleSubmit(isDraft = false) {
    if (!isDraft && !validate()) return
    if (!equipe) {
      toast.error('Équipe non trouvée')
      return
    }

    setLoading(true)

    try {
      const token = generateSecureToken()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 72)

      // Créer le chantier
      const { data: chantier, error: chantierError } = await supabase
        .from('chantiers')
        .insert({
          equipe_id: equipe.id,
          adresse: formData.adresse,
          led_count: parseInt(formData.led_count) || 0,
          client_name: formData.client_name,
          client_email: formData.client_email || null,
          client_phone: formData.client_phone || null,
          commentaire: formData.commentaire || null,
          status: isDraft ? STATUTS.DRAFT : STATUTS.PENDING_CLIENT,
          validation_token: token,
          validation_expires_at: expiresAt.toISOString(),
          date_intervention: new Date().toISOString(),
        })
        .select()
        .single()

      if (chantierError) throw chantierError

      // Upload des photos
      if (photosBefore.length > 0 || photosAfter.length > 0) {
        const uploadedPhotos = await uploadPhotos(chantier.id)
        
        const photoRecords = uploadedPhotos.map(p => ({
          chantier_id: chantier.id,
          url: p.url,
          photo_type: p.type,
        }))

        await supabase.from('chantier_photos').insert(photoRecords)
      }

      // Upload des documents
      if (documents.length > 0) {
        const uploadedDocs = await uploadDocuments(chantier.id)
        
        const docRecords = uploadedDocs.map(d => ({
          chantier_id: chantier.id,
          url: d.url,
          filename: d.filename,
          file_type: d.file_type,
        }))

        await supabase.from('chantier_documents').insert(docRecords)
      }

      // Si pas brouillon, envoyer la notification au client
      if (!isDraft) {
        const { error: notifyError } = await supabase.functions.invoke('notify-client', {
          body: { chantierId: chantier.id }
        })

        if (notifyError) {
          console.error('Notify error:', notifyError)
        }
      }

      toast.success(isDraft ? 'Brouillon enregistré' : 'Chantier envoyé au client')
      onSuccess?.()
      
      // Reset form
      setFormData({
        adresse: '',
        led_count: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        commentaire: '',
      })
      setPhotosBefore([])
      setPhotosAfter([])
      setDocuments([])
    } catch (error) {
      console.error('Error creating chantier:', error)
      toast.error('Erreur lors de la création du chantier')
    } finally {
      setLoading(false)
    }
  }

  // Composant PhotoGrid réutilisable
  function PhotoGrid({ photos, type, inputRef, onRemove }) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square">
            <img
              src={photo.preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={() => onRemove(photo.id, type)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {photos.length < 6 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square bg-zinc-800 border-2 border-dashed border-zinc-600 rounded-xl flex flex-col items-center justify-center hover:border-orange-500 hover:bg-zinc-800/80 transition-colors"
          >
            <Camera className="w-6 h-6 text-zinc-500 mb-1" />
            <span className="text-zinc-500 text-xs">Ajouter</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouveau chantier" size="lg">
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Adresse */}
        <Input
          name="adresse"
          label="Adresse du chantier *"
          placeholder="12 rue des Lilas, 75001 Paris"
          icon={MapPin}
          value={formData.adresse}
          onChange={handleChange}
          error={errors.adresse}
        />

        {/* Nombre LED */}
        <Input
          name="led_count"
          type="number"
          label="Nombre de LED installées *"
          placeholder="0"
          icon={Zap}
          value={formData.led_count}
          onChange={handleChange}
          error={errors.led_count}
        />

        {/* Client */}
        <Input
          name="client_name"
          label="Nom du client *"
          placeholder="M. Dupont ou SCI Horizon"
          icon={User}
          value={formData.client_name}
          onChange={handleChange}
          error={errors.client_name}
        />

        {/* Email & Téléphone */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            name="client_email"
            type="email"
            label="Email client"
            placeholder="client@email.com"
            icon={Mail}
            value={formData.client_email}
            onChange={handleChange}
            error={errors.client_email}
          />
          <Input
            name="client_phone"
            type="tel"
            label="Téléphone"
            placeholder="06 12 34 56 78"
            icon={Phone}
            value={formData.client_phone}
            onChange={handleChange}
            error={errors.client_phone}
          />
        </div>
        <p className="text-zinc-500 text-xs -mt-4">
          Email ou téléphone requis pour envoyer la validation
        </p>

        {/* Commentaire */}
        <Textarea
          name="commentaire"
          label="Commentaire (optionnel)"
          placeholder="Notes ou remarques sur l'intervention..."
          rows={3}
          value={formData.commentaire}
          onChange={handleChange}
        />

        {/* Photos AVANT */}
        <div>
          <label className="text-zinc-400 text-sm font-medium block mb-2">
            📷 Photos AVANT chantier (optionnel)
          </label>
          <PhotoGrid 
            photos={photosBefore} 
            type="before" 
            inputRef={fileInputBeforeRef}
            onRemove={removePhoto}
          />
          <input
            ref={fileInputBeforeRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handlePhotoSelect(e, 'before')}
          />
        </div>

        {/* Photos APRÈS */}
        <div>
          <label className="text-zinc-400 text-sm font-medium block mb-2">
            📷 Photos APRÈS chantier *
          </label>
          <PhotoGrid 
            photos={photosAfter} 
            type="after" 
            inputRef={fileInputAfterRef}
            onRemove={removePhoto}
          />
          <input
            ref={fileInputAfterRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handlePhotoSelect(e, 'after')}
          />
          <p className="text-zinc-500 text-xs mt-2">
            Minimum 1 photo après, maximum 6 par catégorie. 5MB max par photo.
          </p>
        </div>

        {/* Documents */}
        <div>
          <label className="text-zinc-400 text-sm font-medium block mb-2">
            📄 Documents (optionnel)
          </label>
          
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 bg-zinc-800 rounded-lg p-3">
                <FileText className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <span className="text-sm text-zinc-300 flex-1 truncate">{doc.name}</span>
                <button
                  type="button"
                  onClick={() => removeDocument(doc.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {documents.length < 5 && (
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="w-full bg-zinc-800 border-2 border-dashed border-zinc-600 rounded-lg p-4 flex items-center justify-center gap-2 hover:border-orange-500 hover:bg-zinc-800/80 transition-colors"
              >
                <Upload className="w-5 h-5 text-zinc-500" />
                <span className="text-zinc-500 text-sm">Ajouter un document</span>
              </button>
            )}
          </div>
          
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            multiple
            className="hidden"
            onChange={handleDocSelect}
          />
          <p className="text-zinc-500 text-xs mt-2">
            PDF, Word, Excel, images. Max 5 fichiers, 10MB chacun.
          </p>
        </div>

        {/* Boutons */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={() => handleSubmit(false)}
            loading={loading}
            className="w-full"
            size="lg"
          >
            <Send className="w-5 h-5" />
            Envoyer au client
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => handleSubmit(true)}
            loading={loading}
            className="w-full"
          >
            <Save className="w-5 h-5" />
            Enregistrer en brouillon
          </Button>
        </div>
      </div>
    </Modal>
  )
}
