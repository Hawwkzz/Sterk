import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Zap, MapPin, User, Mail, Phone, Calendar, CheckCircle, Clock, AlertCircle, Send, Download, Image as ImageIcon, MessageSquare } from 'lucide-react'
import { useChantier } from '../hooks/useChantiers'
import { supabase } from '../lib/supabase'
import { STATUT_CONFIG, STATUTS } from '../lib/constants'
import { formatDate, formatDateTime, formatNumber } from '../lib/utils'
import { generateChantierPDF, downloadPDF } from '../lib/pdf'
import { Card, Button, Spinner, Badge } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const STATUS_ICONS = {
  [STATUTS.VALIDE]: CheckCircle,
  [STATUTS.PENDING_CLIENT]: Clock,
  [STATUTS.REFUSE]: AlertCircle,
  [STATUTS.DRAFT]: Clock,
}

export default function ChantierDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { equipe } = useAuth()
  const { chantier, loading, error } = useChantier(id)

  async function handleResend() {
    try {
      const { error } = await supabase.functions.invoke('notify-client', {
        body: { chantierId: chantier.id }
      })

      if (error) throw error
      toast.success('Lien de validation renvoyé au client')
    } catch (err) {
      console.error('Resend error:', err)
      toast.error('Erreur lors de l\'envoi')
    }
  }

  async function handleDownloadPDF() {
    try {
      const photos = chantier.photos?.map(p => p.url) || []
      const doc = await generateChantierPDF(chantier, equipe, photos)
      downloadPDF(doc, `rapport-chantier-${chantier.id}.pdf`)
      toast.success('PDF téléchargé')
    } catch (err) {
      console.error('PDF error:', err)
      toast.error('Erreur lors de la génération du PDF')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !chantier) {
    return (
      <div className="py-6 text-center">
        <p className="text-zinc-500 mb-4">Chantier non trouvé</p>
        <Button variant="secondary" onClick={() => navigate('/chantiers')}>
          Retour aux chantiers
        </Button>
      </div>
    )
  }

  const config = STATUT_CONFIG[chantier.status] || STATUT_CONFIG[STATUTS.DRAFT]
  const StatusIcon = STATUS_ICONS[chantier.status] || Clock

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/chantiers')}
          className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Détail chantier</h1>
          <p className="text-zinc-500 text-sm">#{chantier.id}</p>
        </div>
      </div>

      {/* Statut */}
      <div className={`rounded-xl p-4 ${config.bgColor} border ${config.borderColor} flex items-center gap-3`}>
        <StatusIcon className={`w-6 h-6 ${config.textColor}`} />
        <div className="flex-1">
          <p className={`font-semibold ${config.textColor}`}>{config.label}</p>
          <p className="text-zinc-400 text-sm">
            {chantier.status === STATUTS.PENDING_CLIENT && 'En attente de validation client'}
            {chantier.status === STATUTS.VALIDE && 'Chantier validé et comptabilisé'}
            {chantier.status === STATUTS.REFUSE && 'Le client a refusé - correction requise'}
            {chantier.status === STATUTS.DRAFT && 'Brouillon non envoyé'}
          </p>
        </div>
      </div>

      {/* LED count highlight */}
      <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/10 rounded-xl p-5 border border-orange-500/20 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Zap className="w-6 h-6 text-orange-400" />
          <span className="text-3xl font-black text-white">
            {formatNumber(chantier.led_count)}
          </span>
        </div>
        <p className="text-orange-300 text-sm">LED installées</p>
      </div>

      {/* Informations */}
      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-white mb-4">Informations</h2>
        
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

        <hr className="border-zinc-700/50" />

        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-zinc-500 mt-0.5" />
          <div>
            <p className="text-zinc-500 text-xs">Client</p>
            <p className="text-white">{chantier.client_name}</p>
          </div>
        </div>

        {chantier.client_email && (
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-zinc-500 mt-0.5" />
            <div>
              <p className="text-zinc-500 text-xs">Email</p>
              <p className="text-white">{chantier.client_email}</p>
            </div>
          </div>
        )}

        {chantier.client_phone && (
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-zinc-500 mt-0.5" />
            <div>
              <p className="text-zinc-500 text-xs">Téléphone</p>
              <p className="text-white">{chantier.client_phone}</p>
            </div>
          </div>
        )}

        {chantier.commentaire && (
          <>
            <hr className="border-zinc-700/50" />
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-zinc-500 mt-0.5" />
              <div>
                <p className="text-zinc-500 text-xs">Commentaire</p>
                <p className="text-white">{chantier.commentaire}</p>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Photos */}
      {chantier.photos && chantier.photos.length > 0 && (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Photos</h2>
          <div className="grid grid-cols-3 gap-2">
            {chantier.photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-lg overflow-hidden bg-zinc-800"
              >
                <img
                  src={photo.url}
                  alt="Photo chantier"
                  className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Refus info */}
      {chantier.status === STATUTS.REFUSE && chantier.refus && chantier.refus.length > 0 && (
        <Card className="p-5 border-red-500/30 bg-red-500/10">
          <h2 className="text-lg font-semibold text-red-400 mb-4">Motif du refus</h2>
          {chantier.refus.map((refus) => (
            <div key={refus.id}>
              <p className="text-white">{refus.commentaire}</p>
              <p className="text-zinc-500 text-xs mt-2">
                {formatDateTime(refus.created_at)}
              </p>
              
              {refus.photos && refus.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {refus.photos.map((photo) => (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden bg-zinc-800"
                    >
                      <img
                        src={photo.url}
                        alt="Photo refus"
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {chantier.status === STATUTS.DRAFT && (
          <Button className="w-full" size="lg">
            <Send className="w-5 h-5" />
            Envoyer au client
          </Button>
        )}

        {chantier.status === STATUTS.PENDING_CLIENT && (
          <Button className="w-full" size="lg" variant="secondary" onClick={handleResend}>
            <Send className="w-5 h-5" />
            Renvoyer le lien
          </Button>
        )}

        {chantier.status === STATUTS.REFUSE && (
          <Button className="w-full" size="lg">
            Corriger et renvoyer
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={handleDownloadPDF}
        >
          <Download className="w-5 h-5" />
          Télécharger le rapport PDF
        </Button>
      </div>

      {/* Métadonnées */}
      <div className="text-center pt-4">
        <p className="text-zinc-600 text-xs">
          Créé le {formatDateTime(chantier.created_at)}
        </p>
        {chantier.validated_at && (
          <p className="text-zinc-600 text-xs">
            Validé le {formatDateTime(chantier.validated_at)}
          </p>
        )}
      </div>
    </div>
  )
}
