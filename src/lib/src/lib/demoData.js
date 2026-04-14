// Données fictives pour le mode démo.
// Tout est statique, lu seul. Aucune action ne les modifie.

import { STATUTS, CEE_STATUTS, SECTEUR_DEFAUT } from './constants'

// ---- Profils / entités « utilisateur » fictives ----

export const DEMO_ENTREPRISE = {
  id: 'demo-entreprise-001',
  name: 'EOIA Démo SAS',
  siret: '89012345600012',
  adresse: '12 rue des Artisans, 59000 Lille',
  email: 'demo@eoia-energie.fr',
  telephone: '03 20 00 00 00',
  delegataire_defaut: 'Hellio',
  created_at: '2024-01-15T10:00:00Z',
}

export const DEMO_EQUIPE = {
  id: 'demo-equipe-001',
  name: 'Équipe Nord - Démo',
  responsable: 'Thomas Lemaire',
  entreprise_id: 'demo-entreprise-001',
  secteur_id: 'demo-secteur-led',
  blocked: false,
  created_at: '2024-02-01T09:00:00Z',
}

export const DEMO_SECTEUR = {
  ...SECTEUR_DEFAUT,
  id: 'demo-secteur-led',
}

export const DEMO_PROFILE_ENTREPRISE = {
  id: 'demo-user-entreprise',
  email: 'demo-entreprise@eoia.fr',
  full_name: 'Julien Martin (Démo)',
  role: 'entreprise',
  entreprise_id: 'demo-entreprise-001',
  equipe_id: null,
  created_at: '2024-01-15T10:00:00Z',
}

export const DEMO_PROFILE_EQUIPE = {
  id: 'demo-user-equipe',
  email: 'demo-equipe@eoia.fr',
  full_name: 'Kevin Dubois (Démo)',
  role: 'equipe',
  entreprise_id: 'demo-entreprise-001',
  equipe_id: 'demo-equipe-001',
  created_at: '2024-02-01T09:00:00Z',
}

export const DEMO_USER_ENTREPRISE = {
  id: 'demo-user-entreprise',
  email: 'demo-entreprise@eoia.fr',
  aud: 'authenticated',
  app_metadata: { provider: 'demo' },
  user_metadata: { demo: true },
  created_at: '2024-01-15T10:00:00Z',
}

export const DEMO_USER_EQUIPE = {
  id: 'demo-user-equipe',
  email: 'demo-equipe@eoia.fr',
  aud: 'authenticated',
  app_metadata: { provider: 'demo' },
  user_metadata: { demo: true },
  created_at: '2024-02-01T09:00:00Z',
}

// ---- Équipes (pour classement côté entreprise) ----

export const DEMO_EQUIPES = [
  { id: 'demo-equipe-001', name: 'Équipe Nord - Démo', responsable: 'Thomas Lemaire', blocked: false, secteur: { slug: 'led', label: 'LED Relamping', unit_label: 'LED', prime_par_unite: 5 }, chantiersValides: 18 },
  { id: 'demo-equipe-002', name: 'Équipe Sud - Démo', responsable: 'Sophie Bernard', blocked: false, secteur: { slug: 'led', label: 'LED Relamping', unit_label: 'LED', prime_par_unite: 5 }, chantiersValides: 14 },
  { id: 'demo-equipe-003', name: 'Équipe IRVE - Démo', responsable: 'Marc Lefèvre', blocked: false, secteur: { slug: 'pac', label: 'PAC / IRVE', unit_label: 'bornes', prime_par_unite: 50 }, chantiersValides: 7 },
]

// ---- Chantiers fictifs ----

const PHOTO = (q) => `https://source.unsplash.com/800x600/?${encodeURIComponent(q)}`

export const DEMO_CHANTIERS = [
  {
    id: 'demo-chantier-001',
    adresse: '23 avenue Jean Jaurès, 59000 Lille',
    client_name: 'Cabinet Dr. Martin',
    client_email: 'contact@cabinet-martin.fr',
    client_phone: '03 20 11 22 33',
    date_intervention: '2026-03-15',
    unit_count: 48,
    status: STATUTS.VALIDE,
    commentaire: 'Remplacement total de l\'éclairage fluorescent par LED.',
    created_at: '2026-03-10T08:30:00Z',
    equipe_id: 'demo-equipe-001',
    equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo' },
    photos: [
      { id: 'p1', url: PHOTO('office,ceiling'), photo_type: 'AVANT', created_at: '2026-03-15T09:00:00Z' },
      { id: 'p2', url: PHOTO('led,office,light'), photo_type: 'APRES', created_at: '2026-03-15T17:00:00Z' },
    ],
    documents: [],
    refus: [],
  },
  {
    id: 'demo-chantier-002',
    adresse: '5 rue du Commerce, 59100 Roubaix',
    client_name: 'Leclerc Roubaix',
    client_email: 'direction@leclerc-roubaix.fr',
    client_phone: '03 20 33 44 55',
    date_intervention: '2026-03-22',
    unit_count: 120,
    status: STATUTS.VALIDE,
    commentaire: 'Relamping complet parking + enseignes.',
    created_at: '2026-03-18T10:00:00Z',
    equipe_id: 'demo-equipe-001',
    equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo' },
    photos: [
      { id: 'p3', url: PHOTO('parking,night'), photo_type: 'AVANT' },
      { id: 'p4', url: PHOTO('parking,led'), photo_type: 'APRES' },
    ],
    documents: [],
    refus: [],
  },
  {
    id: 'demo-chantier-003',
    adresse: '14 rue de la République, 59800 Lille',
    client_name: 'Logiroute Entrepôt',
    client_email: 'logistique@logiroute.fr',
    client_phone: '03 20 55 66 77',
    date_intervention: '2026-04-02',
    unit_count: 210,
    status: STATUTS.PENDING_CLIENT,
    commentaire: 'En attente validation client.',
    created_at: '2026-03-28T14:15:00Z',
    equipe_id: 'demo-equipe-001',
    equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo' },
    photos: [
      { id: 'p5', url: PHOTO('warehouse,old,light'), photo_type: 'AVANT' },
      { id: 'p6', url: PHOTO('warehouse,led,bright'), photo_type: 'APRES' },
    ],
    documents: [],
    refus: [],
  },
  {
    id: 'demo-chantier-004',
    adresse: '78 boulevard Victor Hugo, 59500 Douai',
    client_name: 'Pharmacie Centrale',
    client_email: 'pharmacie.centrale@orange.fr',
    client_phone: '03 27 88 99 00',
    date_intervention: '2026-04-08',
    unit_count: 22,
    status: STATUTS.SUBMITTED,
    commentaire: 'Soumis, dossier en cours de traitement.',
    created_at: '2026-04-05T11:00:00Z',
    equipe_id: 'demo-equipe-001',
    equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo' },
    photos: [
      { id: 'p7', url: PHOTO('pharmacy,interior'), photo_type: 'AVANT' },
    ],
    documents: [],
    refus: [],
  },
  {
    id: 'demo-chantier-005',
    adresse: '2 impasse des Peupliers, 59300 Valenciennes',
    client_name: 'Garage Legrand',
    client_email: 'garage.legrand@gmail.com',
    client_phone: '03 27 11 22 00',
    date_intervention: '2026-04-10',
    unit_count: 34,
    status: STATUTS.REFUSE,
    commentaire: 'Photos APRES manquantes — à refaire.',
    created_at: '2026-04-09T09:30:00Z',
    equipe_id: 'demo-equipe-001',
    equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo' },
    photos: [
      { id: 'p8', url: PHOTO('garage,workshop'), photo_type: 'AVANT' },
    ],
    documents: [],
    refus: [
      { id: 'r1', commentaire: 'Il manque les photos APRES travaux.', created_at: '2026-04-09T15:00:00Z', photos: [] },
    ],
  },
  {
    id: 'demo-chantier-006',
    adresse: '45 rue des Érables, 59200 Tourcoing',
    client_name: 'Boulangerie Dufour',
    client_email: 'boulangerie.dufour@free.fr',
    client_phone: '03 20 77 88 99',
    date_intervention: '2026-04-12',
    unit_count: 18,
    status: STATUTS.VALIDE,
    commentaire: 'Validé par le client.',
    created_at: '2026-04-11T08:00:00Z',
    equipe_id: 'demo-equipe-001',
    equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo' },
    photos: [
      { id: 'p9', url: PHOTO('bakery,interior'), photo_type: 'AVANT' },
      { id: 'p10', url: PHOTO('bakery,led'), photo_type: 'APRES' },
    ],
    documents: [],
    refus: [],
  },
]

// ---- Dossiers CEE fictifs (vue entreprise) ----

export const DEMO_DOSSIERS_CEE = [
  {
    id: 'demo-dossier-001',
    chantier_id: 'demo-chantier-001',
    entreprise_id: 'demo-entreprise-001',
    delegataire: 'Hellio',
    statut: CEE_STATUTS.VALIDE,
    montant_prime_estime: 1240,
    montant_prime_recu: 1240,
    created_at: '2026-03-20T10:00:00Z',
    chantier: {
      id: 'demo-chantier-001', adresse: '23 avenue Jean Jaurès, 59000 Lille',
      unit_count: 48, client_name: 'Cabinet Dr. Martin', client_email: 'contact@cabinet-martin.fr',
      status: STATUTS.VALIDE, date_intervention: '2026-03-15',
      equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo' },
    },
    documents: [
      { id: 'd1', type_document: 'ATTESTATION_HONNEUR', nom: 'attestation.pdf', url: '#', valide: true },
      { id: 'd2', type_document: 'FACTURE', nom: 'facture-001.pdf', url: '#', valide: true },
      { id: 'd3', type_document: 'PHOTO_AVANT', nom: 'avant.jpg', url: PHOTO('office,ceiling'), valide: true },
      { id: 'd4', type_document: 'PHOTO_APRES', nom: 'apres.jpg', url: PHOTO('led,office,light'), valide: true },
    ],
  },
  {
    id: 'demo-dossier-002',
    chantier_id: 'demo-chantier-002',
    entreprise_id: 'demo-entreprise-001',
    delegataire: 'Effy',
    statut: CEE_STATUTS.EN_TRAITEMENT,
    montant_prime_estime: 3100,
    montant_prime_recu: 0,
    created_at: '2026-03-25T11:00:00Z',
    chantier: {
      id: 'demo-chantier-002', adresse: '5 rue du Commerce, 59100 Roubaix',
      unit_count: 120, client_name: 'Leclerc Roubaix', client_email: 'direction@leclerc-roubaix.fr',
      status: STATUTS.VALIDE, date_intervention: '2026-03-22',
      equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo' },
    },
    documents: [
      { id: 'd5', type_document: 'DEVIS', nom: 'devis-signe.pdf', url: '#', valide: true },
      { id: 'd6', type_document: 'FACTURE', nom: 'facture-002.pdf', url: '#', valide: true },
      { id: 'd7', type_document: 'FICHE_TECHNIQUE', nom: 'fiche-tech.pdf', url: '#', valide: true },
    ],
  },
  {
    id: 'demo-dossier-003',
    chantier_id: 'demo-chantier-006',
    entreprise_id: 'demo-entreprise-001',
    delegataire: 'TotalEnergies',
    statut: CEE_STATUTS.A_COMPLETER,
    montant_prime_estime: 450,
    montant_prime_recu: 0,
    created_at: '2026-04-12T09:00:00Z',
    chantier: {
      id: 'demo-chantier-006', adresse: '45 rue des Érables, 59200 Tourcoing',
      unit_count: 18, client_name: 'Boulangerie Dufour', client_email: 'boulangerie.dufour@free.fr',
      status: STATUTS.VALIDE, date_intervention: '2026-04-12',
      equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo' },
    },
    documents: [
      { id: 'd8', type_document: 'PHOTO_AVANT', nom: 'avant.jpg', url: PHOTO('bakery,interior'), valide: true },
    ],
  },
]

// ---- Stats pré-calculées ----

export function computeDemoChantierStats() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const monthChantiers = DEMO_CHANTIERS.filter(c => new Date(c.created_at) >= monthStart)
  const yearChantiers = DEMO_CHANTIERS.filter(c => new Date(c.created_at) >= yearStart)
  const QUOTA = DEMO_SECTEUR.quota_mensuel
  const PRIME = DEMO_SECTEUR.prime_par_unite
  const sum = (arr, s) => arr.filter(c => c.status === s).reduce((a, c) => a + (c.unit_count || 0), 0)
  const ledValidees = sum(monthChantiers, STATUTS.VALIDE)
  const ledEnAttente = sum(monthChantiers, STATUTS.PENDING_CLIENT)
  const ledRefusees = sum(monthChantiers, STATUTS.REFUSE)
  const ledValideesAnnee = sum(yearChantiers, STATUTS.VALIDE)
  return {
    ledValidees, ledEnAttente, ledRefusees,
    primeMensuelle: Math.max(0, ledValidees - QUOTA) * PRIME,
    primeAnnuelle: Math.max(0, ledValideesAnnee - QUOTA) * PRIME,
    totalChantiers: monthChantiers.length,
    chantiersValides: monthChantiers.filter(c => c.status === STATUTS.VALIDE).length,
    chantiersEnAttente: monthChantiers.filter(c => c.status === STATUTS.PENDING_CLIENT).length,
    chantiersRefuses: monthChantiers.filter(c => c.status === STATUTS.REFUSE).length,
  }
}

export function computeDemoEntrepriseStats() {
  const allDossiers = DEMO_DOSSIERS_CEE
  const primeEstimee = allDossiers.reduce((s, d) => s + (parseFloat(d.montant_prime_estime) || 0), 0)
  const primeRecue = allDossiers.reduce((s, d) => s + (parseFloat(d.montant_prime_recu) || 0), 0)
  const parStatut = {}
  allDossiers.forEach(d => { parStatut[d.statut] = (parStatut[d.statut] || 0) + 1 })
  const chantiersValides = DEMO_CHANTIERS.filter(c => c.status === STATUTS.VALIDE).length
  const chantierIdsAvecDossier = new Set(allDossiers.map(d => d.chantier_id))
  const chantiersSansDossier = DEMO_CHANTIERS.filter(c => c.status === STATUTS.VALIDE && !chantierIdsAvecDossier.has(c.id)).length
  return {
    totalDossiers: allDossiers.length,
    chantiersValides, chantiersSansDossier,
    primeEstimee, primeRecue,
    parStatut,
    nbEquipes: DEMO_EQUIPES.length,
  }
}

export const DEMO_CLASSEMENT = [
  { id: 'demo-equipe-001', name: 'Équipe Nord - Démo', totalLed: 186, prime: 0, isMe: true, rank: 2 },
  { id: 'demo-equipe-004', name: 'Équipe Métropole', totalLed: 240, prime: 0, isMe: false, rank: 1 },
  { id: 'demo-equipe-002', name: 'Équipe Sud - Démo', totalLed: 140, prime: 0, isMe: false, rank: 3 },
  { id: 'demo-equipe-005', name: 'Équipe Flandres', totalLed: 95, prime: 0, isMe: false, rank: 4 },
]
