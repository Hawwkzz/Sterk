import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatDate, formatDateTime } from './utils'

/**
 * Charge une image depuis une URL et retourne un objet { dataUrl, width, height }
 */
function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.85),
          width: img.naturalWidth,
          height: img.naturalHeight,
        })
      } catch (e) {
        console.error('Error converting image:', e)
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/**
 * Calcule les dimensions d'une image pour qu'elle rentre dans une zone
 * SANS Ãªtre coupÃ©e (fit, pas fill)
 */
function fitImage(imgWidth, imgHeight, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight)
  return {
    width: imgWidth * ratio,
    height: imgHeight * ratio,
  }
}

/**
 * VÃ©rifie si on a assez de place, sinon ajoute une page
 */
function checkPageBreak(doc, yPos, needed) {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (yPos + needed > pageHeight - 20) {
    doc.addPage()
    return 20
  }
  return yPos
}

export async function generateChantierPDF(chantier, equipe) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2

  // =============================================
  // EN-TÃTE
  // =============================================
  doc.setFillColor(249, 115, 22)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('EOIA Energie', margin, 20)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text("Rapport d'intervention LED", margin, 30)

  doc.setFontSize(10)
  doc.text(`Rapport NÂ° ${chantier.id?.slice(0, 8) || '---'}`, pageWidth - margin, 20, { align: 'right' })
  doc.text(formatDateTime(new Date()), pageWidth - margin, 28, { align: 'right' })

  let yPos = 55

  // =============================================
  // SECTION ÃQUIPE
  // =============================================
  doc.setTextColor(249, 115, 22)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('ÃQUIPE', margin, yPos)
  yPos += 2
  doc.setDrawColor(249, 115, 22)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, margin + 30, yPos)
  yPos += 7

  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Nom : ${equipe?.name || 'Non spÃ©cifiÃ©'}`, margin, yPos)
  yPos += 6
  doc.text(`Responsable : ${equipe?.responsable || 'Non spÃ©cifiÃ©'}`, margin, yPos)
  yPos += 14

  // =============================================
  // SECTION CLIENT
  // =============================================
  doc.setTextColor(249, 115, 22)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENT', margin, yPos)
  yPos += 2
  doc.line(margin, yPos, margin + 30, yPos)
  yPos += 7

  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Nom : ${chantier.client_name}`, margin, yPos)
  yPos += 6
  if (chantier.client_email) {
    doc.text(`Email : ${chantier.client_email}`, margin, yPos)
    yPos += 6
  }
  if (chantier.client_phone) {
    doc.text(`TÃ©lÃ©phone : ${chantier.client_phone}`, margin, yPos)
    yPos += 6
  }
  yPos += 10

  // =============================================
  // SECTION CHANTIER
  // =============================================
  doc.setTextColor(249, 115, 22)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('DÃTAILS DU CHANTIER', margin, yPos)
  yPos += 2
  doc.line(margin, yPos, margin + 70, yPos)
  yPos += 7

  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Adresse : ${chantier.adresse}`, margin, yPos)
  yPos += 6
  doc.text(`Date d'intervention : ${formatDate(chantier.date_intervention)}`, margin, yPos)
  yPos += 6
  doc.text(`Statut : ${chantier.status}`, margin, yPos)
  yPos += 12

  // Mise en avant LED
  doc.setFillColor(255, 247, 237)
  doc.roundedRect(margin, yPos, contentWidth, 22, 3, 3, 'F')
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(234, 88, 12)
  doc.text(`${chantier.led_count} LED installÃ©es`, pageWidth / 2, yPos + 14, { align: 'center' })

  doc.setTextColor(60, 60, 60)
  yPos += 32

  // =============================================
  // COMMENTAIRES
  // =============================================
  if (chantier.commentaire) {
    yPos = checkPageBreak(doc, yPos, 30)
    doc.setTextColor(249, 115, 22)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('COMMENTAIRES', margin, yPos)
    yPos += 2
    doc.line(margin, yPos, margin + 55, yPos)
    yPos += 7

    doc.setTextColor(60, 60, 60)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const splitComment = doc.splitTextToSize(chantier.commentaire, contentWidth)
    doc.text(splitComment, margin, yPos)
    yPos += splitComment.length * 5 + 10
  }

  // =============================================
  // DOCUMENTS JOINTS
  // =============================================
  if (chantier.documents && chantier.documents.length > 0) {
    yPos = checkPageBreak(doc, yPos, 30)
    doc.setTextColor(249, 115, 22)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('DOCUMENTS JOINTS', margin, yPos)
    yPos += 2
    doc.line(margin, yPos, margin + 65, yPos)
    yPos += 7

    doc.setTextColor(60, 60, 60)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    chantier.documents.forEach((docItem, index) => {
      yPos = checkPageBreak(doc, yPos, 8)
      const name = docItem.filename || `Document ${index + 1}`
      const type = docItem.file_type ? ` (${docItem.file_type.split('/').pop()?.toUpperCase()})` : ''
      doc.text(`${index + 1}. ${name}${type}`, margin + 4, yPos)
      yPos += 6
    })
    yPos += 8
  }

  // =============================================
  // PHOTOS AVANT
  // =============================================
  const photosBefore = chantier.photos?.filter(p => p.photo_type === 'before') || []
  const photosAfter = chantier.photos?.filter(p => p.photo_type === 'after' || !p.photo_type) || []

  if (photosBefore.length > 0) {
    doc.addPage()
    yPos = 20

    doc.setTextColor(249, 115, 22)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('ð·  PHOTOS AVANT INTERVENTION', margin, yPos)
    yPos += 3
    doc.setLineWidth(0.8)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 10

    for (let i = 0; i < photosBefore.length; i++) {
      const imgData = await loadImage(photosBefore[i].url)
      if (!imgData) continue

      // Taille max par photo : largeur complÃ¨te, hauteur max 90mm
      const maxW = contentWidth
      const maxH = 90
      const { width, height } = fitImage(imgData.width, imgData.height, maxW, maxH)

      yPos = checkPageBreak(doc, yPos, height + 15)

      // Centrer l'image
      const xOffset = margin + (contentWidth - width) / 2
      doc.addImage(imgData.dataUrl, 'JPEG', xOffset, yPos, width, height)
      yPos += height + 4

      // LÃ©gende
      doc.setTextColor(120, 120, 120)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.text(`Photo avant nÂ°${i + 1}`, pageWidth / 2, yPos, { align: 'center' })
      yPos += 10
    }
  }

  // =============================================
  // PHOTOS APRÃS
  // =============================================
  if (photosAfter.length > 0) {
    doc.addPage()
    yPos = 20

    doc.setTextColor(249, 115, 22)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('ð·  PHOTOS APRÃS INTERVENTION', margin, yPos)
    yPos += 3
    doc.setLineWidth(0.8)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 10

    for (let i = 0; i < photosAfter.length; i++) {
      const imgData = await loadImage(photosAfter[i].url)
      if (!imgData) continue

      const maxW = contentWidth
      const maxH = 90
      const { width, height } = fitImage(imgData.width, imgData.height, maxW, maxH)

      yPos = checkPageBreak(doc, yPos, height + 15)

      const xOffset = margin + (contentWidth - width) / 2
      doc.addImage(imgData.dataUrl, 'JPEG', xOffset, yPos, width, height)
      yPos += height + 4

      doc.setTextColor(120, 120, 120)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.text(`Photo aprÃ¨s nÂ°${i + 1}`, pageWidth / 2, yPos, { align: 'center' })
      yPos += 10
    }
  }

  // =============================================
  // REFUS (si applicable)
  // =============================================
  if (chantier.refus && chantier.refus.length > 0) {
    doc.addPage()
    yPos = 20

    doc.setTextColor(220, 38, 38)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('MOTIF DU REFUS', margin, yPos)
    yPos += 3
    doc.setDrawColor(220, 38, 38)
    doc.setLineWidth(0.8)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 10

    for (const refus of chantier.refus) {
      doc.setTextColor(60, 60, 60)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const splitRefus = doc.splitTextToSize(refus.commentaire || '', contentWidth)
      doc.text(splitRefus, margin, yPos)
      yPos += splitRefus.length * 5 + 4

      doc.setTextColor(120, 120, 120)
      doc.setFontSize(8)
      doc.text(`Date : ${formatDateTime(refus.created_at)}`, margin, yPos)
      yPos += 10

      // Photos du refus
      if (refus.photos && refus.photos.length > 0) {
        for (let i = 0; i < refus.photos.length; i++) {
          const imgData = await loadImage(refus.photos[i].url)
          if (!imgData) continue

          const { width, height } = fitImage(imgData.width, imgData.height, contentWidth, 80)
          yPos = checkPageBreak(doc, yPos, height + 15)

          const xOffset = margin + (contentWidth - width) / 2
          doc.addImage(imgData.dataUrl, 'JPEG', xOffset, yPos, width, height)
          yPos += height + 4

          doc.setTextColor(120, 120, 120)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'italic')
          doc.text(`Photo refus nÂ°${i + 1}`, pageWidth / 2, yPos, { align: 'center' })
          yPos += 10
        }
      }
    }
  }

  // =============================================
  // PIED DE PAGE sur toutes les pages
  // =============================================
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Document gÃ©nÃ©rÃ© automatiquement par EOIA Energie â Page ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  return doc
}

/**
 * GÃ©nÃ¨re un rapport PDF complet pour un dossier CEE
 * Inclut : infos chantier, infos dossier, checklist documents, photos
 */
export async function generateDossierCEEPDF(dossier, entreprise) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  const chantier = dossier.chantier || {}
  const documents = dossier.documents || []

  // =============================================
  // EN-TÃTE
  // =============================================
  doc.setFillColor(249, 115, 22)
  doc.rect(0, 0, pageWidth, 45, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(entreprise?.nom || 'Dossier CEE', margin, 20)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('Dossier CEE â Rapport complet', margin, 30)

  doc.setFontSize(10)
  doc.text(`RÃ©f: ${dossier.reference_externe || dossier.id?.slice(0, 8) || '---'}`, pageWidth - margin, 20, { align: 'right' })
  doc.text(`Statut: ${dossier.statut?.replace(/_/g, ' ')}`, pageWidth - margin, 28, { align: 'right' })
  doc.text(formatDateTime(new Date()), pageWidth - margin, 36, { align: 'right' })

  let yPos = 60

  // =============================================
  // INFOS CHANTIER
  // =============================================
  doc.setTextColor(249, 115, 22)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMATIONS CHANTIER', margin, yPos)
  yPos += 2
  doc.setDrawColor(249, 115, 22)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, margin + 80, yPos)
  yPos += 8

  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  const infoRows = [
    ['Client', chantier.client_name || 'â'],
    ['Adresse', chantier.adresse || 'â'],
    ['Email', chantier.client_email || 'â'],
    ['TÃ©lÃ©phone', chantier.client_phone || 'â'],
    ['Date intervention', chantier.date_intervention ? formatDate(chantier.date_intervention) : 'â'],
    ['UnitÃ©s installÃ©es', String(chantier.unit_count || 'â')],
    ['Ãquipe', chantier.equipe?.name || 'â'],
    ['Statut chantier', chantier.status || 'â'],
  ]

  infoRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label} :`, margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, margin + 50, yPos)
    yPos += 6
  })
  yPos += 8

  // =============================================
  // INFOS DOSSIER CEE
  // =============================================
  yPos = checkPageBreak(doc, yPos, 50)
  doc.setTextColor(249, 115, 22)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMATIONS DOSSIER CEE', margin, yPos)
  yPos += 2
  doc.line(margin, yPos, margin + 80, yPos)
  yPos += 8

  doc.setTextColor(60, 60, 60)
  doc.setFontSize(10)

  const dossierRows = [
    ['DÃ©lÃ©gataire', dossier.delegataire || 'â'],
    ['RÃ©fÃ©rence externe', dossier.reference_externe || 'â'],
    ['Prime estimÃ©e', dossier.montant_prime_estime ? `${parseFloat(dossier.montant_prime_estime).toLocaleString('fr-FR')} â¬` : 'â'],
    ['Prime reÃ§ue', dossier.montant_prime_recu ? `${parseFloat(dossier.montant_prime_recu).toLocaleString('fr-FR')} â¬` : 'â'],
    ['Date envoi', dossier.date_envoi ? formatDate(dossier.date_envoi) : 'â'],
    ['Date validation', dossier.date_validation ? formatDate(dossier.date_validation) : 'â'],
  ]

  dossierRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label} :`, margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, margin + 50, yPos)
    yPos += 6
  })

  if (dossier.commentaire) {
    yPos += 4
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(120, 120, 120)
    const splitComment = doc.splitTextToSize(`Note: ${dossier.commentaire}`, contentWidth)
    doc.text(splitComment, margin, yPos)
    yPos += splitComment.length * 5
  }
  yPos += 10

  // =============================================
  // CHECKLIST DOCUMENTS
  // =============================================
  yPos = checkPageBreak(doc, yPos, 60)
  doc.setTextColor(249, 115, 22)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(`DOCUMENTS (${documents.filter(d => d.valide).length}/${documents.length} validÃ©s)`, margin, yPos)
  yPos += 2
  doc.line(margin, yPos, margin + 80, yPos)
  yPos += 8

  doc.setFontSize(9)
  documents.forEach(d => {
    yPos = checkPageBreak(doc, yPos, 8)
    const icon = d.valide ? '[OK]' : '[ ]'
    const source = d.source === 'equipe_photo' || d.source === 'equipe_document' ? ' (Ã©quipe)' : ''
    doc.setTextColor(d.valide ? 34 : 160, d.valide ? 197 : 160, d.valide ? 94 : 160)
    doc.setFont('helvetica', 'normal')
    doc.text(`${icon}  ${d.nom}${source}`, margin + 4, yPos)
    yPos += 5
  })
  yPos += 10

  // =============================================
  // PHOTOS (celles qui ont une URL)
  // =============================================
  const photoDocs = documents.filter(d => d.url && (d.type_document === 'PHOTO_AVANT' || d.type_document === 'PHOTO_APRES'))

  if (photoDocs.length > 0) {
    doc.addPage()
    yPos = 20

    doc.setTextColor(249, 115, 22)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('PHOTOS DU DOSSIER', margin, yPos)
    yPos += 3
    doc.setLineWidth(0.8)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 10

    for (let i = 0; i < photoDocs.length; i++) {
      const photoDoc = photoDocs[i]
      const imgData = await loadImage(photoDoc.url)
      if (!imgData) continue

      const maxW = contentWidth
      const maxH = 90
      const { width, height } = fitImage(imgData.width, imgData.height, maxW, maxH)

      yPos = checkPageBreak(doc, yPos, height + 20)

      const xOffset = margin + (contentWidth - width) / 2
      doc.addImage(imgData.dataUrl, 'JPEG', xOffset, yPos, width, height)
      yPos += height + 4

      doc.setTextColor(120, 120, 120)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      const typeLabel = photoDoc.type_document === 'PHOTO_AVANT' ? 'AVANT' : 'APRÃS'
      doc.text(`${typeLabel} â ${photoDoc.nom}`, pageWidth / 2, yPos, { align: 'center' })
      yPos += 12
    }
  }

  // =============================================
  // PIED DE PAGE
  // =============================================
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Dossier CEE â ${entreprise?.nom || 'Entreprise'} â ${chantier.client_name || ''} â Page ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  return doc
}

export function downloadPDF(doc, filename) {
  doc.save(filename)
}

export function getPDFBlob(doc) {
  return doc.output('blob')
}

export function getPDFBase64(doc) {
  return doc.output('datauristring')
}
