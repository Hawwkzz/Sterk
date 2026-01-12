import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatDate, formatDateTime } from './utils'

export async function generateChantierPDF(chantier, equipe, photos = []) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // En-tête avec logo
  doc.setFillColor(249, 115, 22) // Orange STERK
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  // Titre
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('STERK & Construction', 20, 20)
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('Rapport d\'intervention LED', 20, 30)
  
  // Numéro de rapport
  doc.setFontSize(10)
  doc.text(`Rapport N° ${chantier.id}`, pageWidth - 20, 20, { align: 'right' })
  doc.text(formatDateTime(new Date()), pageWidth - 20, 28, { align: 'right' })
  
  // Contenu principal
  doc.setTextColor(0, 0, 0)
  let yPos = 55
  
  // Section Équipe
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('ÉQUIPE', 20, yPos)
  yPos += 8
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Nom : ${equipe?.name || 'Non spécifié'}`, 20, yPos)
  yPos += 6
  doc.text(`Responsable : ${equipe?.responsable || 'Non spécifié'}`, 20, yPos)
  yPos += 15
  
  // Section Client
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENT', 20, yPos)
  yPos += 8
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Nom : ${chantier.client_name}`, 20, yPos)
  yPos += 6
  if (chantier.client_email) {
    doc.text(`Email : ${chantier.client_email}`, 20, yPos)
    yPos += 6
  }
  if (chantier.client_phone) {
    doc.text(`Téléphone : ${chantier.client_phone}`, 20, yPos)
    yPos += 6
  }
  yPos += 10
  
  // Section Chantier
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('DÉTAILS DU CHANTIER', 20, yPos)
  yPos += 8
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Adresse : ${chantier.adresse}`, 20, yPos)
  yPos += 6
  doc.text(`Date d'intervention : ${formatDate(chantier.date_intervention)}`, 20, yPos)
  yPos += 6
  
  // Mise en avant du nombre de LED
  yPos += 5
  doc.setFillColor(255, 247, 237) // Orange très clair
  doc.roundedRect(20, yPos, pageWidth - 40, 20, 3, 3, 'F')
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(234, 88, 12) // Orange foncé
  doc.text(`${chantier.led_count} LED installées`, pageWidth / 2, yPos + 13, { align: 'center' })
  
  doc.setTextColor(0, 0, 0)
  yPos += 35
  
  // Commentaires si présents
  if (chantier.commentaire) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('COMMENTAIRES', 20, yPos)
    yPos += 8
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const splitComment = doc.splitTextToSize(chantier.commentaire, pageWidth - 40)
    doc.text(splitComment, 20, yPos)
    yPos += splitComment.length * 5 + 10
  }
  
  // Photos (si disponibles)
  if (photos.length > 0) {
    // Nouvelle page pour les photos si nécessaire
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('PHOTOS', 20, yPos)
    yPos += 10
    
    const photoWidth = (pageWidth - 50) / 2
    const photoHeight = 60
    let xPos = 20
    
    for (let i = 0; i < Math.min(photos.length, 4); i++) {
      try {
        doc.addImage(photos[i], 'JPEG', xPos, yPos, photoWidth, photoHeight)
        if (i % 2 === 0) {
          xPos = pageWidth / 2 + 5
        } else {
          xPos = 20
          yPos += photoHeight + 10
        }
      } catch (e) {
        console.error('Erreur ajout photo:', e)
      }
    }
  }
  
  // Pied de page
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Document généré automatiquement par STERK LED - Page ${i}/${pageCount}`,
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
