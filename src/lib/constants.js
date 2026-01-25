// Règles métier STERK
export const QUOTA_MENSUEL = 1200
export const PRIME_PAR_LED = 5
export const LIEN_EXPIRATION_HEURES = 72

// Statuts des chantiers
export const STATUTS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  PENDING_CLIENT: 'PENDING_CLIENT',
  VALIDE: 'VALIDE',
  REFUSE: 'REFUSE',
  CORRIGE: 'CORRIGE',
}

export const STATUT_CONFIG = {
  [STATUTS.DRAFT]: {
    label: 'Brouillon',
    color: 'zinc',
    bgColor: 'bg-zinc-500/20',
    textColor: 'text-zinc-400',
    borderColor: 'border-zinc-500/30',
  },
  [STATUTS.SUBMITTED]: {
    label: 'Soumis',
    color: 'blue',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  [STATUTS.PENDING_CLIENT]: {
    label: 'En attente client',
    color: 'amber',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
  },
  [STATUTS.VALIDE]: {
    label: 'Validé',
    color: 'emerald',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  [STATUTS.REFUSE]: {
    label: 'Refusé',
    color: 'red',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
  },
  [STATUTS.CORRIGE]: {
    label: 'Corrigé',
    color: 'blue',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
  },
}

// Rôles utilisateurs
export const ROLES = {
  EQUIPE: 'equipe',
  ADMIN: 'admin',
}

// Formats de date
export const DATE_FORMAT = 'dd/MM/yyyy'
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm'
