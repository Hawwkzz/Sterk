import { MapPin, Clock, AlertTriangle, ShieldCheck } from 'lucide-react'
import { formatCoords, getMapsUrl } from '../lib/photoMetadata'

/**
 * Badge affichant la conformité CEE 2026 d'une photo :
 *  - horodatée (timestamp EXIF)
 *  - géolocalisée (GPS EXIF ou navigateur)
 *
 * Props :
 *  - photo: { exif_timestamp, exif_lat, exif_lng, exif_source, exif_device }
 *  - compact: bool (affichage réduit)
 */
export default function PhotoComplianceBadge({ photo, compact = false }) {
  if (!photo) return null
  const hasTimestamp = !!photo.exif_timestamp
  const hasGps = photo.exif_lat != null && photo.exif_lng != null
  const conforme = hasTimestamp && hasGps
  const src = photo.exif_source

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-[10px]">
        {conforme ? (
          <span className="flex items-center gap-0.5 text-emerald-400" title="Horodatée + géolocalisée">
            <ShieldCheck className="w-3 h-3" />
          </span>
        ) : (
          <span className="flex items-center gap-0.5 text-amber-400" title="Conformité incomplète">
            <AlertTriangle className="w-3 h-3" />
          </span>
        )}
      </div>
    )
  }

  const ts = hasTimestamp ? new Date(photo.exif_timestamp) : null
  const dateStr = ts ? ts.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : null

  return (
    <div className={`rounded-lg p-2 space-y-1 text-[11px] ${conforme ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
      <div className="flex items-center gap-1.5 text-zinc-300">
        <Clock className={`w-3 h-3 ${hasTimestamp ? 'text-emerald-400' : 'text-amber-400'}`} />
        <span>{hasTimestamp ? dateStr : 'Non horodatée'}</span>
      </div>
      <div className="flex items-center gap-1.5 text-zinc-300">
        <MapPin className={`w-3 h-3 ${hasGps ? 'text-emerald-400' : 'text-amber-400'}`} />
        {hasGps ? (
          <a
            href={getMapsUrl(photo.exif_lat, photo.exif_lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-orange-400"
            onClick={(e) => e.stopPropagation()}
          >
            {formatCoords(photo.exif_lat, photo.exif_lng)}
          </a>
        ) : (
          <span>Non géolocalisée</span>
        )}
        {hasGps && src && (
          <span className="text-zinc-500 text-[9px]">({src === 'exif' ? 'EXIF' : 'navigateur'})</span>
        )}
      </div>
      {photo.exif_device && (
        <div className="text-zinc-500 text-[9px] truncate">📱 {photo.exif_device}</div>
      )}
    </div>
  )
}
