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
 * SANS être coupée (fit, pas fill)
 */
function fitImage(imgWidth, imgHeight, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight)
  return {
    width: imgWidth * ratio,
    height: imgHeight * ratio,
  }
}

/**
 * Vérifie si on a assez de place, sinon ajoute une page
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
  // EN-TÊTE
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
  doc.text(`Rapport N° ${chantier.id?.slice(0, 8) || '---'}`, pageWidth - margin, 20, { align: 'right' })
  doc.text(formatDateTime(new Date()), pageWidth - margin, 28, { align: 'right' })

  let yPos = 55

  // =============================================
  // SECTION ÉQUIPE
  // =============================================
  doc.setTextColor(249, 115, 22)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('ÉQUIPE', margin, yPos)
  yPos += 2
  doc.setDrawColor(249, 115, 22)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, margin + 30, yPos)
  yPos += 7

  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Nom : ${equipe?.name || 'Non spécifié'}`, margin, yPos)
  yPos += 6
  doc.text(`Responsable : ${equipe?.responsable || 'Non spécifié'}`, margin, yPos)
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
    doc.text(`Téléphone : ${chantier.client_phone}`, margin, yPos)
    yPos += 6
  }
  yPos += 10

  // =============================================
  // SECTION CHANTIER
  // =============================================
  doc.setTextColor(249, 115, 22)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('DÉTAILS DU CHANTIER', margin, yPos)
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
  doc.text(`${chantier.led_count} LED installées`, pageWidth / 2, yPos + 14, { align: 'center' })

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
    doc.text('📷  PHOTOS AVANT INTERVENTION', margin, yPos)
    yPos += 3
    doc.setLineWidth(0.8)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 10

    for (let i = 0; i < photosBefore.length; i++) {
      const imgData = await loadImage(photosBefore[i].url)
      if (!imgData) continue

      // Taille max par photo : largeur complète, hauteur max 90mm
      const maxW = contentWidth
      const maxH = 90
      const { width, height } = fitImage(imgData.width, imgData.height, maxW, maxH)

      yPos = checkPageBreak(doc, yPos, height + 15)

      // Centrer l'image
      const xOffset = margin + (contentWidth - width) / 2
      doc.addImage(imgData.dataUrl, 'JPEG', xOffset, yPos, width, height)
      yPos += height + 4

      // Légende
      doc.setTextColor(120, 120, 120)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.text(`Photo avant n°${i + 1}`, pageWidth / 2, yPos, { align: 'center' })
      yPos += 10
    }
  }

  // =============================================
  // PHOTOS APRÈS
  // =============================================
  if (photosAfter.length > 0) {
    doc.addPage()
    yPos = 20

    doc.setTextColor(249, 115, 22)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('📷  PHOTOS APRÈS INTERVENTION', margin, yPos)
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
      doc.text(`Photo après n°${i + 1}`, pageWidth / 2, yPos, { align: 'center' })
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
          doc.text(`Photo refus n°${i + 1}`, pageWidth / 2, yPos, { align: 'center' })
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
      `Document généré automatiquement par EOIA Energie — Page ${i}/${pageCount}`,
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
