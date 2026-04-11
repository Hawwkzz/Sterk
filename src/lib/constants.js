// Règles métier STERK
// QUOTA_MENSUEL et PRIME_PAR_UNITE sont désormais configurés par secteur (table 'secteurs' en DB)

export const LIEN_EXPIRATION_HEURES = 72

export const SECTEUR_SLUGS = { LED: 'led', PAC: 'pac', PV: 'pv' }

export const SECTEUR_DEFAUT = {
  slug: 'led', label: 'LED Relamping',
  unit_label: 'LED', unit_label_plural: 'LED',
  quota_mensuel: 1200, prime_par_unite: 5,
  icon: 'zap', color: 'orange',
}

export const STATUTS = {
  DRAFT: 'DRAFT', SUBMITTED: 'SUBMITTED', PENDING_CLIENT: 'PENDING_CLIENT',
  VALIDE: 'VALIDE', REFUSE: 'REFUSE', CORRIGE: 'CORRIGE',
}

export const STATUT_CONFIG = {
  [STATUTS.DRAFT]: { label: 'Brouillon', color: 'zinc', bgColor: 'bg-zinc-500/20', textColor: 'text-zinc-400', borderColor: 'border-zinc-500/30' },
  [STATUTS.SUBMITTED]: { label: 'Soumis', color: 'blue', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400', borderColor: 'border-blue-500/30' },
  [STATUTS.PENDING_CLIENT]: { label: 'En attente client', color: 'amber', bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', borderColor: 'border-amber-500/30' },
  [STATUTS.VALIDE]: { label: 'Validé', color: 'emerald', bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
  [STATUTS.REFUSE]: { label: 'Refusé', color: 'red', bgColor: 'bg-red-500/20', textColor: 'text-red-400', borderColor: 'border-red-500/30' },
  [STATUTS.CORRIGE]: { label: 'Corrigé', color: 'blue', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400', borderColor: 'border-blue-500/30' },
}

export const ROLES = { EQUIPE: 'equipe', ADMIN: 'admin' }
export const DATE_FORMAT = 'dd/MM/yyyy'
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm'
