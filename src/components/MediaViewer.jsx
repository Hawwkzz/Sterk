import { useState, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react'

/**
 * Viewer fullscreen pour photos et documents.
 * S'ouvre PAR-DESSUS l'app → aucune navigation, aucune perte d'état.
 * Résout le bug iOS PWA où window.open() causait un rechargement.
 */
export default function MediaViewer({ url, alt, onClose }) {
  const [zoomed, setZoomed] = useState(false)

  // Fermer avec la touche Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    // Bloquer le scroll du body
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!url) return null

  // Détecter si c'est un document (PDF, etc.) plutôt qu'une image
  const isDocument = /\.(pdf|doc|docx|xls|xlsx)(\?|$)/i.test(url)

  function handleDownload(e) {
    e.stopPropagation()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="flex gap-2">
          {!isDocument && (
            <button
              onClick={() => setZoomed(!zoomed)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              {zoomed ? <ZoomOut className="w-5 h-5 text-white" /> : <ZoomIn className="w-5 h-5 text-white" />}
            </button>
          )}
          <button
            onClick={handleDownload}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Download className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 flex items-center justify-center overflow-auto p-4"
        onClick={onClose}
      >
        {isDocument ? (
          <div
            className="text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Download className="w-10 h-10 text-orange-400" />
            </div>
            <p className="text-white font-medium mb-2">{alt || 'Document'}</p>
            <p className="text-zinc-400 text-sm mb-6">
              Aperçu non disponible pour ce type de fichier
            </p>
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium"
            >
              Ouvrir dans un nouvel onglet
            </button>
          </div>
        ) : (
          <img
            src={url}
            alt={alt || 'Photo'}
            onClick={e => {
              e.stopPropagation()
              setZoomed(!zoomed)
            }}
            className={`
              max-h-full rounded-lg transition-transform duration-200 select-none
              ${zoomed ? 'max-w-none w-auto cursor-zoom-out' : 'max-w-full object-contain cursor-zoom-in'}
            `}
            draggable={false}
          />
        )}
      </div>
    </div>
  )
}
