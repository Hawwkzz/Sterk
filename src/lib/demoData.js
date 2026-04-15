// Données fictives pour le mode démo.
// Tout est statique, lecture seule. Aucune action ne les modifie.

import { STATUTS, CEE_STATUTS, SECTEUR_DEFAUT } from './constants'

// Helper : photos Picsum (fiables, stables, seedées)
// Photos Unsplash – thèmes chantiers énergétiques RGE
const P = {
  led_av:     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&q=80',
  travaux:    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=400&fit=crop&q=80',
  parking_av: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&h=400&fit=crop&q=80',
  toiture_av: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=400&fit=crop&q=80',
  led_ap:     'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop&q=80',
  solaire:    'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop&q=80',
  pac:        'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&h=400&fit=crop&q=80',
  irve:       'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&h=400&fit=crop&q=80',
}

// ---- Profils / entités « utilisateur » fictives ----

export const DEMO_ENTREPRISE = {
  id: 'demo-entreprise-001',
  name: 'EOIA Démo SAS',
  nom: 'EOIA Démo SAS',
  siret: '89012345600012',
  adresse: '12 rue des Artisans, 59000 Lille',
  email: 'demo@eoia-energie.fr',
  telephone: '03 20 00 00 00',
  delegataire_defaut: 'Hellio',
  created_at: '2024-01-15T10:00:00Z',
}

// Secteur LED pour la démo
export const DEMO_SECTEUR = {
  id: 'demo-secteur-led',
  slug: 'led',
  label: 'LED Relamping',
  unit_label: 'LED',
  unit_label_plural: 'LED',
  quota_mensuel: 1000,
  prime_par_unite: 5,
  icon: 'zap',
  color: 'orange',
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

// ---- Équipes (pour la vue entreprise / classement) ----

export const DEMO_EQUIPES = [
  { id: 'demo-equipe-001', name: 'Équipe Nord - Démo', responsable: 'Thomas Lemaire', blocked: false, secteur: { slug: 'led', label: 'LED Relamping', unit_label: 'LED', prime_par_unite: 5 }, chantiersValides: 18 },
  { id: 'demo-equipe-002', name: 'Équipe PAC / PV', responsable: 'Sophie Bernard', blocked: false, secteur: { slug: 'pac', label: 'PAC & PV Résidentiel', unit_label: 'unités', prime_par_unite: 50 }, chantiersValides: 11 },
  { id: 'demo-equipe-003', name: 'Équipe IRVE', responsable: 'Marc Lefèvre', blocked: false, secteur: { slug: 'irve', label: 'Bornes IRVE', unit_label: 'bornes', prime_par_unite: 80 }, chantiersValides: 7 },
]

// ---- Chantiers fictifs (variés : LED, PAC, PV, IRVE) ----
// IMPORTANT: photo_type doit être 'before' ou 'after' en minuscule pour
// matcher le filtre de ChantierDetailPage.jsx (ligne 221/239).

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
    commentaire: 'LED — Remplacement total de l\'éclairage fluorescent par LED (cabinet médical, 3 étages).',
    created_at: '2026-03-10T08:30:00Z',
    equipe_id: 'demo-equipe-001',
    equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo', responsable: 'Thomas Lemaire' },
    photos: [
      { id: 'p1a', url: P.led_av, photo_type: 'before', created_at: '2026-03-15T09:00:00Z' },
      { id: 'p1b', url: P.travaux, photo_type: 'before', created_at: '2026-03-15T09:05:00Z' },
      { id: 'p1c', url: P.led_ap, photo_type: 'after', created_at: '2026-03-15T17:00:00Z' },
      { id: 'p1d', url: P.led_ap, photo_type: 'after', created_at: '2026-03-15T17:15:00Z' },
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
    commentaire: 'LED — Relamping complet parking + enseignes extérieures (supermarché).',
    created_at: '2026-03-18T10:00:00Z',
    equipe_id: 'demo-equipe-001',
    equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo', responsable: 'Thomas Lemaire' },
    photos: [
      { id: 'p2a', url: P.parking_av, photo_type: 'before' },
      { id: 'p2b', url: P.parking_av, photo_type: 'before' },
      { id: 'p2c', url: P.led_ap, photo_type: 'after' },
      { id: 'p2d', url: P.led_ap, photo_type: 'after' },
    ],
    documents: [],
    refus: [],
  },
  {
    id: 'demo-chantier-003',
    adresse: '78 allée des Tilleuls, 59500 Douai',
    client_name: 'Villa Delcourt',
    client_email: 'delcourt.famille@orange.fr',
    client_phone: '03 27 88 99 00',
    date_intervention: '2026-04-02',
    unit_count: 1,
    status: STATUTS.VALIDE,
    commentaire: 'PAC — Pompe à chaleur air/eau 14 kW, remplacement chaudière fioul. Prime MaPrimeRénov\' + CEE.',
    created_at: '2026-03-28T14:15:00Z',
    equipe_id: 'demo-equipe-001',
    equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo', responsable: 'Thomas Lemaire' },
    photos: [
      { id: 'p3a', url: P.travaux, photo_type: 'before' },
      { id: 'p3b', url: P.travaux, photo_type: 'before' },
      { id: 'p3c', url: P.pac, photo_type: 'after' },
      { id: 'p3d', url: P.pac, photo_type: 'after' },
    ],
    documents: [],
    refus: [],
  },
  {
    id: 'demo-chantier-004',
    adresse: '14 chemin des Vignes, 59800 Lille',
    client_name: 'Ferme Bio Duhamel',
    client_email: 'contact@ferme-duhamel.fr',
    client_phone: '03 20 55 66 77',
    date_intervention: '2026-04-08',
    unit_count: 12,
    status: STATUTS.PENDING_CLIENT,
    commentaire: 'PV — Installation photovoltaïque 12 kWc sur toiture bâtiment agricole. Autoconsommation + revente surplus.',
    created_at: '2026-04-05T11:00:00Z',
    equipe_id: 'demo-equipe-001',
    equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo', responsable: 'Thomas Lemaire' },
    photos: [
      { id: 'p4a', url: P.toiture_av, photo_type: 'before' },
      { id: 'p4b', url: P.toiture_av, photo_type: 'before' },
      { id: 'p4c', url: P.solaire, photo_type: 'after' },
      { id: 'p4d', url: P.solaire, photo_type: 'after' },
    ],
    documents: [],
    refus: [],
  },
  {
    id: 'demo-chantier-005',
    adresse: 'Parking Leclerc, 59200 Tourcoing',
    client_name: 'Leclerc Tourcoing',
    client_email: 'direction@leclerc-tourcoing.fr',
    client_phone: '03 20 11 22 00',
    date_intervention: '2026-04-10',
    unit_count: 8,
    status: STATUTS.SUBMITTED,
    commentaire: 'IRVE — Installation 8 bornes de recharge 22 kW (4 double) sur parking supermarché. Conformité AFIREV.',
    created_at: '2026-04-09T09:30:00Z',
    equipe_id: 'demo-equipe-001',
    equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo', responsable: 'Thomas Lemaire' },
    photos: [
      { id: 'p5a', url: P.parking_av, photo_type: 'before' },
      { id: 'p5b', url: P.travaux, photo_type: 'before' },
      { id: 'p5c', url: P.irve, photo_type: 'after' },
      { id: 'p5d', url: P.irve, photo_type: 'after' },
    ],
    documents: [],
    refus: [],
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
    commentaire: 'LED — Rénovation éclairage boutique + fournil (tubes LED T8 24W).',
    created_at: '2026-04-11T08:00:00Z',
    equipe_id: 'demo-equipe-001',
    equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo', responsable: 'Thomas Lemaire' },
    photos: [
      { id: 'p6a', url: P.led_av, photo_type: 'before' },
      { id: 'p6b', url: P.travaux, photo_type: 'before' },
      { id: 'p6c', url: P.led_ap, photo_type: 'after' },
      { id: 'p6d', url: P.led_ap, photo_type: 'after' },
    ],
    documents: [],
    refus: [],
  },
  {
    id: 'demo-chantier-007',
    adresse: '2 impasse du Lac, 59300 Valenciennes',
    client_name: 'M. et Mme Lefebvre',
    client_email: 'lefebvre.jm@gmail.com',
    client_phone: '03 27 11 22 33',
    date_intervention: '2026-04-14',
    unit_count: 1,
    status: STATUTS.REFUSE,
    commentaire: 'PAC — Pompe à chaleur géothermique 9 kW. Photos APRES manquantes lors de la soumission.',
    created_at: '2026-04-14T09:30:00Z',
    equipe_id: 'demo-equipe-001',
    equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo', responsable: 'Thomas Lemaire' },
    photos: [
      { id: 'p7a', url: P.travaux, photo_type: 'before' },
    ],
    documents: [],
    refus: [
      { id: 'r1', commentaire: 'Il manque les photos APRES travaux (unité extérieure + arrivée chauffage).', created_at: '2026-04-14T15:00:00Z', photos: [
        { id: 'rp1', url: P.travaux },
      ] },
    ],
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
      { id: 'd1', type_document: 'ATTESTATION_HONNEUR', nom: 'attestation.pdf', url: null, valide: true },
      { id: 'd2', type_document: 'FACTURE', nom: 'facture-001.pdf', url: null, valide: true },
      { id: 'd3', type_document: 'PHOTO_AVANT', nom: 'avant.jpg', url: P.led_av, valide: true },
      { id: 'd4', type_document: 'PHOTO_APRES', nom: 'apres.jpg', url: P.led_ap, valide: true },
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
      { id: 'd5', type_document: 'DEVIS', nom: 'devis-signe.pdf', url: null, valide: true },
      { id: 'd6', type_document: 'FACTURE', nom: 'facture-002.pdf', url: null, valide: true },
      { id: 'd7', type_document: 'FICHE_TECHNIQUE', nom: 'fiche-tech.pdf', url: null, valide: true },
    ],
  },
  {
    id: 'demo-dossier-003',
    chantier_id: 'demo-chantier-003',
    entreprise_id: 'demo-entreprise-001',
    delegataire: 'TotalEnergies',
    statut: CEE_STATUTS.VALIDE,
    montant_prime_estime: 4200,
    montant_prime_recu: 4200,
    created_at: '2026-04-05T09:00:00Z',
    chantier: {
      id: 'demo-chantier-003', adresse: '78 allée des Tilleuls, 59500 Douai',
      unit_count: 1, client_name: 'Villa Delcourt', client_email: 'delcourt.famille@orange.fr',
      status: STATUTS.VALIDE, date_intervention: '2026-04-02',
      equipe: { id: 'demo-equipe-001', name: 'Équipe Nord - Démo' },
    },
    documents: [
      { id: 'd8', type_document: 'ATTESTATION_HONNEUR', nom: 'attestation-pac.pdf', url: null, valide: true },
      { id: 'd9', type_document: 'FICHE_TECHNIQUE', nom: 'fiche-pac-14kw.pdf', url: null, valide: true },
      { id: 'd10', type_document: 'FACTURE', nom: 'facture-pac.pdf', url: null, valide: true },
    ],
  },
  {
    id: 'demo-dossier-004',
    chantier_id: 'demo-chantier-006',
    entreprise_id: 'demo-entreprise-001',
    delegataire: 'Engie',
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
      { id: 'd11', type_document: 'PHOTO_AVANT', nom: 'avant.jpg', url: P.led_av, valide: true },
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
  { id: 'demo-equipe-004', name: 'Équipe Métropole', totalLed: 240, prime: 0, isMe: false, rank: 1 },
  { id: 'demo-equipe-001', name: 'Équipe Nord - Démo', totalLed: 186, prime: 0, isMe: true, rank: 2 },
  { id: 'demo-equipe-002', name: 'Équipe PAC / PV', totalLed: 140, prime: 0, isMe: false, rank: 3 },
  { id: 'demo-equipe-005', name: 'Équipe Flandres', totalLed: 95, prime: 0, isMe: false, rank: 4 },
  { id: 'demo-equipe-003', name: 'Équipe IRVE', totalLed: 72, prime: 0, isMe: false, rank: 5 },
]
