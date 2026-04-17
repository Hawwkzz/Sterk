import jsPDF from 'jspdf'
import 'jspdf-autotable'
import JSZip from 'jszip'
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

/**
 * Génère un rapport PDF complet pour un dossier CEE
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
  // EN-TÊTE
  // =============================================
  doc.setFillColor(249, 115, 22)
  doc.rect(0, 0, pageWidth, 45, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(entreprise?.nom || 'Dossier CEE', margin, 20)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('Dossier CEE — Rapport complet', margin, 30)

  doc.setFontSize(10)
  doc.text(`Réf: ${dossier.reference_externe || dossier.id?.slice(0, 8) || '---'}`, pageWidth - margin, 20, { align: 'right' })
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
    ['Client', chantier.client_name || '—'],
    ['Adresse', chantier.adresse || '—'],
    ['Email', chantier.client_email || '—'],
    ['Téléphone', chantier.client_phone || '—'],
    ['Date intervention', chantier.date_intervention ? formatDate(chantier.date_intervention) : '—'],
    ['Unités installées', String(chantier.unit_count || '—')],
    ['Équipe', chantier.equipe?.name || '—'],
    ['Statut chantier', chantier.status || '—'],
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
    ['Délégataire', dossier.delegataire || '—'],
    ['Référence externe', dossier.reference_externe || '—'],
    ['Prime estimée', dossier.montant_prime_estime ? `${parseFloat(dossier.montant_prime_estime).toLocaleString('fr-FR')} €` : '—'],
    ['Prime reçue', dossier.montant_prime_recu ? `${parseFloat(dossier.montant_prime_recu).toLocaleString('fr-FR')} €` : '—'],
    ['Date envoi', dossier.date_envoi ? formatDate(dossier.date_envoi) : '—'],
    ['Date validation', dossier.date_validation ? formatDate(dossier.date_validation) : '—'],
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
  // DONNÉES TECHNIQUES FOS
  // =============================================
  if (dossier.fiche_code) {
    checkPageBreak(40)
    doc.setFillColor(249, 115, 22)
    doc.rect(margin, yPos, contentWidth, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('DONNÉES TECHNIQUES FOS', margin + 2, yPos + 5.5)
    yPos += 12
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    const techRows = [
      ['Fiche FOS', dossier.fiche_code || '-'],
      ['Zone climatique', dossier.zone_climatique || '-'],
      ['kWh cumac', dossier.kwh_cumac ? Number(dossier.kwh_cumac).toLocaleString('fr-FR') : '-'],
      ['Prime estimée (€)', dossier.montant_prime_estime ? Number(dossier.montant_prime_estime).toLocaleString('fr-FR', {minimumFractionDigits: 2}) : '-'],
      ['Date accord préalable', dossier.date_accord_prealable || '-'],
      ['Date facture', dossier.date_facture || '-'],
      ['Date dépôt délégataire', dossier.date_depot_delegataire || '-'],
      ['Référence délégataire', dossier.reference_delegataire || '-'],
    ]
    if (dossier.donnees_techniques && typeof dossier.donnees_techniques === 'object') {
      Object.entries(dossier.donnees_techniques).forEach(([k, v]) => {
        techRows.push([k, v === true ? 'Oui' : v === false ? 'Non' : String(v ?? '-')])
      })
    }
    autoTable(doc, {
      startY: yPos,
      body: techRows,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1.5 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 }, 1: { cellWidth: 'auto' } },
      margin: { left: margin, right: margin },
    })
    yPos = doc.lastAutoTable.finalY + 8
  }

  // =============================================
  // CHECKLIST DOCUMENTS
  // =============================================
  yPos = checkPageBreak(doc, yPos, 60)
  doc.setTextColor(249, 115, 22)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(`DOCUMENTS (${documents.filter(d => d.valide).length}/${documents.length} validés)`, margin, yPos)
  yPos += 2
  doc.line(margin, yPos, margin + 80, yPos)
  yPos += 8

  doc.setFontSize(9)
  documents.forEach(d => {
    yPos = checkPageBreak(doc, yPos, 8)
    const icon = d.valide ? '[OK]' : '[ ]'
    const source = d.source === 'equipe_photo' || d.source === 'equipe_document' ? ' (équipe)' : ''
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
      const typeLabel = photoDoc.type_document === 'PHOTO_AVANT' ? 'AVANT' : 'APRÈS'
      doc.text(`${typeLabel} — ${photoDoc.nom}`, pageWidth / 2, yPos, { align: 'center' })
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
      `Dossier CEE — ${entreprise?.nom || 'Entreprise'} — ${chantier.client_name || ''} — Page ${i}/${pageCount}`,
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

// ==================================================
// ATTESTATION SUR L'HONNEUR (pré-remplie)
// ==================================================
export function generateAttestationHonneurPDF(dossier, entreprise) {
  const doc = new jsPDF()
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - margin * 2
  let y = 25

  const c = dossier.chantier || {}
  const d = dossier.donnees_techniques || {}

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(20, 20, 20)
  doc.text("ATTESTATION SUR L'HONNEUR", pageWidth / 2, y, { align: 'center' })
  y += 6
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(90, 90, 90)
  doc.text("Dispositif des Certificats d'Économies d'Énergie (CEE)", pageWidth / 2, y, { align: 'center' })
  y += 12

  // Bénéficiaire
  doc.setTextColor(20, 20, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('BÉNÉFICIAIRE', margin, y); y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Nom / Raison sociale : ' + (c.client_name || '___________________________'), margin, y); y += 5
  doc.text('Adresse des travaux : ' + (c.adresse || '___________________________'), margin, y); y += 5
  doc.text('Email : ' + (c.client_email || '___________________________'), margin, y); y += 5
  doc.text('Téléphone : ' + (c.client_phone || '___________________________'), margin, y); y += 10

  // Opération
  doc.setFont('helvetica', 'bold')
  doc.text('OPÉRATION', margin, y); y += 6
  doc.setFont('helvetica', 'normal')
  doc.text('Fiche FOS : ' + (dossier.fiche_code || '___________________________'), margin, y); y += 5
  doc.text('Zone climatique : ' + (dossier.zone_climatique || '___'), margin, y); y += 5
  doc.text('Date de facture : ' + (dossier.date_facture || '__________'), margin, y); y += 5
  doc.text('Volume CEE estimé (kWh cumac) : ' + (dossier.kwh_cumac ? Number(dossier.kwh_cumac).toLocaleString('fr-FR') : '__________'), margin, y); y += 10

  // Déclarations
  doc.setFont('helvetica', 'bold')
  doc.text('JE DÉCLARE SUR L\'HONNEUR', margin, y); y += 6
  doc.setFont('helvetica', 'normal')
  const declarations = [
    "- Que les travaux décrits ci-dessus ont bien été réalisés à l'adresse indiquée.",
    "- Que le matériel installé répond aux exigences techniques de la fiche d'opération standardisée.",
    "- Que je n'ai pas sollicité plusieurs demandes de CEE pour la même opération.",
    "- Que je certifie l'exactitude des informations fournies dans le présent dossier.",
    "- Que j'autorise l'entreprise installatrice à valoriser les CEE générés par l'opération.",
  ]
  declarations.forEach(line => {
    const split = doc.splitTextToSize(line, contentWidth)
    doc.text(split, margin, y)
    y += split.length * 5
  })
  y += 8

  // Entreprise
  doc.setFont('helvetica', 'bold')
  doc.text('ENTREPRISE RÉALISATRICE', margin, y); y += 6
  doc.setFont('helvetica', 'normal')
  if (entreprise) {
    doc.text('Raison sociale : ' + (entreprise.nom || ''), margin, y); y += 5
    if (entreprise.siret) { doc.text('SIRET : ' + entreprise.siret, margin, y); y += 5 }
    if (entreprise.adresse) { doc.text('Adresse : ' + entreprise.adresse, margin, y); y += 5 }
    if (entreprise.rge_numero) { doc.text('Qualification RGE : ' + entreprise.rge_numero, margin, y); y += 5 }
  }
  y += 10

  // Signatures
  doc.setFont('helvetica', 'bold')
  doc.text('Fait à ________________, le ' + new Date().toLocaleDateString('fr-FR'), margin, y); y += 12
  doc.text('Signature du bénéficiaire :', margin, y)
  doc.text("Signature de l'entreprise :", pageWidth / 2 + 5, y)
  y += 25
  doc.setDrawColor(160, 160, 160)
  doc.line(margin, y, margin + 70, y)
  doc.line(pageWidth / 2 + 5, y, pageWidth / 2 + 75, y)

  return doc
}

// =============================================
// EXPORT DOSSIER CEE COMPLET EN ZIP
// =============================================

async function fetchFileAsBlob(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()
    const urlPath = new URL(url).pathname
    const filename = decodeURIComponent(urlPath.split('/').pop()) || 'document'
    return { blob, filename }
  } catch (err) {
    console.warn('Impossible de télécharger:', url, err)
    return null
  }
}

/**
 * Génère un ZIP contenant toutes les pièces du dossier CEE :
 * - Attestation sur l'honneur (PDF auto-généré)
 * - Tous les documents uploadés (devis, facture, fiche technique, etc.)
 * - Toutes les photos (avant/après)
 * - Justificatif RGE si disponible dans les données entreprise
 */
export async function exportDossierCEEZip(dossier, entreprise) {
  const zip = new JSZip()
  const documents = dossier.documents || []

  // 1. Attestation sur l'honneur (générée automatiquement)
  try {
    const attestationPDF = generateAttestationHonneurPDF(dossier, entreprise)
    const attestationBlob = attestationPDF.output('blob')
    zip.file('01_Attestation_Honneur.pdf', attestationBlob)
  } catch (err) {
    console.warn('Erreur génération attestation:', err)
  }

  // 2. Documents uploadés, classés par type
  const typeLabels = {
    DEVIS: '02_Devis',
    FACTURE: '03_Facture',
    CADRE_CONTRIBUTION: '04_Cadre_Contribution',
    FICHE_TECHNIQUE: '05_Fiche_Technique',
    AVIS_TECHNIQUE: '06_Avis_Technique',
    ATTESTATION_HONNEUR: '07_Attestation_Uploadee',
    AUTRE: '08_Autre',
  }

  const photoFolder = zip.folder('Photos')
  let photoAvantCount = 0
  let photoApresCount = 0
  const usedFilenames = new Set()

  for (const doc of documents) {
    if (!doc.url) continue

    const result = await fetchFileAsBlob(doc.url)
    if (!result) continue

    const ext = result.filename.includes('.') ? '.' + result.filename.split('.').pop() : ''

    if (doc.type_document === 'PHOTO_AVANT') {
      photoAvantCount++
      photoFolder.file(`avant_${photoAvantCount}${ext || '.jpg'}`, result.blob)
    } else if (doc.type_document === 'PHOTO_APRES') {
      photoApresCount++
      photoFolder.file(`apres_${photoApresCount}${ext || '.jpg'}`, result.blob)
    } else {
      const prefix = typeLabels[doc.type_document] || '09_Document'
      let filename = `${prefix}${ext}`
      if (usedFilenames.has(filename)) {
        const docName = (doc.nom || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
        filename = `${prefix}_${docName}${ext}`
      }
      usedFilenames.add(filename)
      zip.file(filename, result.blob)
    }
  }

  // 3. Justificatif RGE de l'entreprise (si uploadé)
  if (entreprise?.rge_certificate_url) {
    const rgeResult = await fetchFileAsBlob(entreprise.rge_certificate_url)
    if (rgeResult) {
      const ext = rgeResult.filename.includes('.') ? '.' + rgeResult.filename.split('.').pop() : '.pdf'
      zip.file(`10_Justificatif_RGE${ext}`, rgeResult.blob)
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  return zipBlob
}

/**
 * Télécharge un blob en tant que fichier
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
