// Extraction des métadonnées photo (EXIF) : timestamp + GPS
// Utilisé pour conformité CEE 2026 (loi 30 juin 2025, contrôles PAC sur site)

import exifr from 'exifr'

/**
 * Extrait les métadonnées EXIF d'un fichier image.
 * Retour :
 *  {
 *    timestamp: Date | null,
 *    lat: number | null,
 *    lng: number | null,
 *    source: 'exif' | 'browser' | 'none',
 *    device: string | null,
 *  }
 */
export async function extractPhotoMetadata(file) {
  const result = {
    timestamp: null,
    lat: null,
    lng: null,
    source: 'none',
    device: null,
  }

  if (!file || !file.type?.startsWith('image/')) return result

  try {
    const data = await exifr.parse(file, {
      pick: ['DateTimeOriginal', 'CreateDate', 'GPSLatitude', 'GPSLongitude', 'GPSLatitudeRef', 'GPSLongitudeRef', 'Make', 'Model'],
    })

    if (data) {
      if (data.DateTimeOriginal) result.timestamp = new Date(data.DateTimeOriginal)
      else if (data.CreateDate) result.timestamp = new Date(data.CreateDate)

      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        result.lat = data.latitude
        result.lng = data.longitude
        result.source = 'exif'
      } else if (typeof data.GPSLatitude === 'number' && typeof data.GPSLongitude === 'number') {
        result.lat = data.GPSLatitude
        result.lng = data.GPSLongitude
        result.source = 'exif'
      }

      if (data.Make || data.Model) {
        result.device = [data.Make, data.Model].filter(Boolean).join(' ').trim()
      }
    }
  } catch (err) {
    console.warn('EXIF parse failed', err)
  }

  // Si pas de GPS dans l'EXIF, on tente la géoloc navigateur
  if (!result.lat && 'geolocation' in navigator) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000,
        })
      })
      result.lat = position.coords.latitude
      result.lng = position.coords.longitude
      result.source = 'browser'
    } catch {
      // utilisateur a refusé / indisponible — on reste sans GPS
    }
  }

  // Fallback timestamp = now si l'EXIF n'en a pas
  if (!result.timestamp) {
    result.timestamp = new Date(file.lastModified || Date.now())
  }

  return result
}

/**
 * Vérifie si la photo remplit les exigences de conformité CEE 2026 :
 *  - Timestamp présent et < 24h de l'upload (horodaté)
 *  - GPS présent (géolocalisé)
 */
export function checkPhotoCompliance(metadata, opts = {}) {
  const issues = []
  if (!metadata) return [{ level: 'error', message: 'Aucune métadonnée photo' }]

  if (!metadata.timestamp) {
    issues.push({ level: 'error', message: 'Photo non horodatée' })
  } else if (opts.maxAgeHours) {
    const ageHours = (Date.now() - new Date(metadata.timestamp).getTime()) / 3600000
    if (ageHours > opts.maxAgeHours) {
      issues.push({ level: 'warning', message: `Photo prise il y a ${Math.round(ageHours)}h (> ${opts.maxAgeHours}h)` })
    }
  }

  if (!metadata.lat || !metadata.lng) {
    issues.push({ level: 'error', message: 'Photo non géolocalisée (GPS manquant)' })
  } else if (metadata.source === 'browser') {
    issues.push({ level: 'info', message: 'GPS issu du navigateur (pas de l\'EXIF)' })
  }

  return issues
}

/**
 * URL Google Maps pour visualiser la position de la photo.
 */
export function getMapsUrl(lat, lng) {
  if (!lat || !lng) return null
  return `https://www.google.com/maps?q=${lat},${lng}`
}

/**
 * Format court des coordonnées.
 */
export function formatCoords(lat, lng) {
  if (lat == null || lng == null) return null
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
}
