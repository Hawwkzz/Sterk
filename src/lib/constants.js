// Règles métier STERK

// QUOTA_MENSUEL et PRIME_PAR_UNITE sont désormais configurés par secteur (table 'secteurs' en DB)
export const LIEN_EXPIRATION_HEURES = 72

export const SECTEUR_SLUGS = {
  LED: 'led',
  PAC: 'pac',
  PV: 'pv'
}

export const SECTEUR_DEFAUT = {
  slug: 'led',
  label: 'LED Relamping',
  unit_label: 'LED',
  unit_label_plural: 'LED',
  quota_mensuel: 1200,
  prime_par_unite: 5,
  icon: 'zap',
  color: 'orange',
}

export const STATUTS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  PENDING_CLIENT: 'PENDING_CLIENT',
  VALIDE: 'VALIDE',
  REFUSE: 'REFUSE',
  CORRIGE: 'CORRIGE',
}

export const STATUT_CONFIG = {
  [STATUTS.DRAFT]: { label: 'Brouillon', color: 'zinc', bgColor: 'bg-zinc-500/20', textColor: 'text-zinc-400', borderColor: 'border-zinc-500/30' },
  [STATUTS.SUBMITTED]: { label: 'Soumis', color: 'blue', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400', borderColor: 'border-blue-500/30' },
  [STATUTS.PENDING_CLIENT]: { label: 'En attente client', color: 'amber', bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', borderColor: 'border-amber-500/30' },
  [STATUTS.VALIDE]: { label: 'Validé', color: 'emerald', bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
  [STATUTS.REFUSE]: { label: 'Refusé', color: 'red', bgColor: 'bg-red-500/20', textColor: 'text-red-400', borderColor: 'border-red-500/30' },
  [STATUTS.CORRIGE]: { label: 'Corrigé', color: 'blue', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400', borderColor: 'border-blue-500/30' },
}

export const ROLES = {
  EQUIPE: 'equipe',
  ADMIN: 'admin',
  ENTREPRISE: 'entreprise',
}

// ============================================
// CEE (Certificats d'Economie d'Energie)
// ============================================

export const CEE_STATUTS = {
  A_COMPLETER: 'A_COMPLETER',
  PRET: 'PRET',
  ENVOYE: 'ENVOYE',
  EN_TRAITEMENT: 'EN_TRAITEMENT',
  VALIDE: 'VALIDE',
  REFUSE: 'REFUSE',
  PRIME_RECUE: 'PRIME_RECUE',
}

export const CEE_STATUT_CONFIG = {
  [CEE_STATUTS.A_COMPLETER]: { label: 'À compléter', color: 'amber', bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', borderColor: 'border-amber-500/30', order: 1 },
  [CEE_STATUTS.PRET]: { label: 'Prêt à envoyer', color: 'blue', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400', borderColor: 'border-blue-500/30', order: 2 },
  [CEE_STATUTS.ENVOYE]: { label: 'Envoyé', color: 'purple', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400', borderColor: 'border-purple-500/30', order: 3 },
  [CEE_STATUTS.EN_TRAITEMENT]: { label: 'En traitement', color: 'blue', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400', borderColor: 'border-blue-500/30', order: 4 },
  [CEE_STATUTS.VALIDE]: { label: 'Validé', color: 'emerald', bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/30', order: 5 },
  [CEE_STATUTS.REFUSE]: { label: 'Refusé', color: 'red', bgColor: 'bg-red-500/20', textColor: 'text-red-400', borderColor: 'border-red-500/30', order: 6 },
  [CEE_STATUTS.PRIME_RECUE]: { label: 'Prime reçue', color: 'emerald', bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-300', borderColor: 'border-emerald-400/30', order: 7 },
}

export const CEE_DOCUMENT_TYPES = {
  ATTESTATION_HONNEUR: { label: "Attestation sur l'honneur", required: true },
  FICHE_TECHNIQUE: { label: 'Fiche technique matériel', required: true },
  DEVIS: { label: 'Devis signé', required: true },
  FACTURE: { label: 'Facture', required: true },
  CADRE_CONTRIBUTION: { label: 'Cadre de contribution CEE', required: false },
  PHOTO_AVANT: { label: 'Photo avant travaux', required: true },
  PHOTO_APRES: { label: 'Photo après travaux', required: true },
  AVIS_TECHNIQUE: { label: 'Avis technique', required: false },
  AUTRE: { label: 'Autre document', required: false },
}

export const DELEGATAIRES = [
  'Hellio',
  'Effy',
  'Engie',
  'TotalEnergies',
  'EDF',
  'Sonergia',
  'GEO PLC',
  'Autre',
]

export const DATE_FORMAT = 'dd/MM/yyyy'
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm'
