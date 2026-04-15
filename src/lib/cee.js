// Définitions des Fiches d'Opérations Standardisées (FOS) CEE
// Sources: arrêtés officiels du Ministère de la Transition Écologique

// Durée de validité réglementaire d'un dossier CEE : 12 mois après la date de facture
export const CEE_VALIDITY_MONTHS = 12

// Zones climatiques France métropolitaine
export const ZONES_CLIMATIQUES = [
  { value: 'H1', label: 'H1 - Nord & Est (climat le plus froid)' },
  { value: 'H2', label: 'H2 - Ouest & Centre' },
  { value: 'H3', label: 'H3 - Méditerranée' },
]

// ==========================================================
// BAT-EQ-127 — Luminaires LED tertiaire
// ==========================================================
// Formule : kWh cumac = coefficient(secteur) × puissance_totale_W
const COEF_LED_TERTIAIRE = {
  hotellerie_restauration: { coef: 31, duree_vie: 13, label: 'Hôtellerie / Restauration' },
  commerces: { coef: 36, duree_vie: 11, label: 'Commerces' },
  bureaux: { coef: 35, duree_vie: 25, label: 'Bureaux' },
  sante: { coef: 38, duree_vie: 13, label: 'Santé' },
  enseignement: { coef: 24, duree_vie: 25, label: 'Enseignement' },
  autres: { coef: 24, duree_vie: 25, label: 'Autres secteurs tertiaires' },
}

// ==========================================================
// BAR-TH-171 — PAC air/eau résidentiel
// ==========================================================
// Tables officielles kWh cumac (ETAS ≥ 126% et ≥ 111%)
// Sources : Arrêté du 22 décembre 2014 modifié
const BAR_TH_171_TABLE = {
  // Maison individuelle, ETAS ≥ 126%
  maison: {
    111: { H1: { '<70': 36700, '70-90': 57400, '>90': 80000 },
           H2: { '<70': 28600, '70-90': 44700, '>90': 62400 },
           H3: { '<70': 18600, '70-90': 29000, '>90': 40400 } },
    126: { H1: { '<70': 45900, '70-90': 71800, '>90': 100000 },
           H2: { '<70': 35800, '70-90': 55900, '>90': 78000 },
           H3: { '<70': 23300, '70-90': 36300, '>90': 50500 } },
  },
  appartement: {
    111: { H1: { '<35': 16800, '35-60': 26300, '>60': 36600 },
           H2: { '<35': 13100, '35-60': 20500, '>60': 28600 },
           H3: { '<35': 8500, '35-60': 13300, '>60': 18500 } },
    126: { H1: { '<35': 21000, '35-60': 32900, '>60': 45800 },
           H2: { '<35': 16400, '35-60': 25700, '>60': 35700 },
           H3: { '<35': 10600, '35-60': 16700, '>60': 23200 } },
  },
}

// ==========================================================
// BAR-TH-129 — PAC air/air résidentiel
// ==========================================================
// Formule simplifiée : kWh cumac = coef(zone) × surface_chauffee
const COEF_PAC_AIR_AIR = {
  H1: 16800,
  H2: 13100,
  H3: 8500,
}

// ==========================================================
// Schémas de formulaire par fiche
// ==========================================================
export const FICHES = {
  'BAT-EQ-127': {
    code: 'BAT-EQ-127',
    label: 'LED — Luminaires tertiaire',
    secteur: 'tertiaire',
    description: 'Remplacement de luminaires par des luminaires LED dans un bâtiment tertiaire existant.',
    fields: [
      { key: 'secteur_activite', label: "Secteur d'activité", type: 'select',
        options: Object.entries(COEF_LED_TERTIAIRE).map(([k, v]) => ({ value: k, label: v.label })),
        required: true },
      { key: 'nb_luminaires', label: 'Nombre de luminaires installés', type: 'number', required: true, min: 1 },
      { key: 'puissance_unitaire_w', label: 'Puissance unitaire (W)', type: 'number', required: true, step: 0.1 },
      { key: 'marque', label: 'Marque', type: 'text', required: true },
      { key: 'reference', label: 'Référence commerciale', type: 'text', required: true },
      { key: 'flux_lumineux_lm', label: 'Flux lumineux (lm) ≥ 3000', type: 'number', required: true, min: 3000 },
      { key: 'efficacite_lm_w', label: 'Efficacité (lm/W) ≥ 90', type: 'number', required: true, min: 90 },
      { key: 'duree_vie_h', label: 'Durée de vie L80B50 (h) ≥ 35 000', type: 'number', required: true, min: 35000 },
      { key: 'facteur_puissance', label: 'Facteur de puissance > 0,9', type: 'number', required: true, step: 0.01, min: 0.9, max: 1 },
      { key: 'ik', label: 'Indice IK', type: 'text', required: true, placeholder: 'ex: IK08' },
      { key: 'thd_percent', label: 'THD (%) < 25', type: 'number', required: true, max: 25, step: 0.1 },
      { key: 'groupe_risque', label: 'Groupe de risque photobiologique', type: 'select',
        options: [{ value: '0', label: '0 (exempt)' }, { value: '1', label: '1 (faible)' }], required: true },
      { key: 'gradation', label: 'Pré-équipé pour gradation', type: 'checkbox' },
    ],
    compute: (d) => {
      const sect = COEF_LED_TERTIAIRE[d.secteur_activite]
      if (!sect) return null
      const nb = Number(d.nb_luminaires) || 0
      const pw = Number(d.puissance_unitaire_w) || 0
      const puissance_totale = nb * pw
      const cumac = sect.coef * puissance_totale
      return { kwh_cumac: Math.round(cumac), puissance_totale_w: puissance_totale, duree_vie_ans: sect.duree_vie }
    },
  },

  'BAR-TH-171': {
    code: 'BAR-TH-171',
    label: 'PAC air/eau — Résidentiel',
    secteur: 'residentiel',
    description: "Installation d'une pompe à chaleur air/eau dans un bâtiment résidentiel existant (> 2 ans).",
    fields: [
      { key: 'type_logement', label: 'Type de logement', type: 'select',
        options: [{ value: 'maison', label: 'Maison individuelle' }, { value: 'appartement', label: 'Appartement' }],
        required: true },
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select',
        options: ZONES_CLIMATIQUES, required: true },
      { key: 'surface_chauffee_m2', label: 'Surface chauffée (m²)', type: 'number', required: true, min: 1 },
      { key: 'etas_percent', label: "ETAS (%) — efficacité saisonnière", type: 'number', required: true, min: 111, step: 0.1 },
      { key: 'marque', label: 'Marque PAC', type: 'text', required: true },
      { key: 'reference', label: 'Référence PAC', type: 'text', required: true },
      { key: 'puissance_kw', label: 'Puissance thermique nominale (kW)', type: 'number', required: true, step: 0.1 },
      { key: 'cop', label: 'COP', type: 'number', required: true, step: 0.01 },
      { key: 'fluide_frigorigene', label: 'Fluide frigorigène', type: 'text', required: true, placeholder: 'ex: R32' },
      { key: 'residence_principale', label: 'Résidence principale', type: 'checkbox' },
      { key: 'batiment_plus_2_ans', label: 'Bâtiment achevé depuis plus de 2 ans', type: 'checkbox' },
    ],
    compute: (d) => {
      const type = d.type_logement
      const zone = d.zone_climatique
      const etas = Number(d.etas_percent) || 0
      const surface = Number(d.surface_chauffee_m2) || 0
      if (!type || !zone || !etas || !surface) return null
      const palier = etas >= 126 ? 126 : 111
      let tranche
      if (type === 'maison') {
        tranche = surface < 70 ? '<70' : surface <= 90 ? '70-90' : '>90'
      } else {
        tranche = surface < 35 ? '<35' : surface <= 60 ? '35-60' : '>60'
      }
      const cumac = BAR_TH_171_TABLE[type]?.[palier]?.[zone]?.[tranche] || 0
      return { kwh_cumac: cumac, palier_etas: palier, tranche_surface: tranche }
    },
  },

  'BAR-TH-129': {
    code: 'BAR-TH-129',
    label: 'PAC air/air — Résidentiel',
    secteur: 'residentiel',
    description: "Installation d'une pompe à chaleur air/air (climatisation réversible) en résidentiel existant.",
    fields: [
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select', options: ZONES_CLIMATIQUES, required: true },
      { key: 'surface_chauffee_m2', label: 'Surface chauffée (m²)', type: 'number', required: true, min: 1 },
      { key: 'marque', label: 'Marque', type: 'text', required: true },
      { key: 'reference', label: 'Référence', type: 'text', required: true },
      { key: 'puissance_kw', label: 'Puissance (kW)', type: 'number', required: true, step: 0.1 },
      { key: 'seer', label: 'SEER', type: 'number', step: 0.01 },
      { key: 'scop', label: 'SCOP', type: 'number', required: true, step: 0.01, min: 3.9 },
    ],
    compute: (d) => {
      const zone = d.zone_climatique
      const surface = Number(d.surface_chauffee_m2) || 0
      if (!zone || !surface) return null
      const coef = COEF_PAC_AIR_AIR[zone]
      return { kwh_cumac: Math.round(coef * (surface / 100)), coef_zone: coef }
    },
  },

  'BAR-EN-101': {
    code: 'BAR-EN-101',
    label: 'Isolation combles / toitures',
    secteur: 'residentiel',
    description: "Isolation de combles perdus ou rampants de toiture dans un bâtiment résidentiel.",
    fields: [
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select', options: ZONES_CLIMATIQUES, required: true },
      { key: 'surface_isolee_m2', label: 'Surface isolée (m²)', type: 'number', required: true, min: 1 },
      { key: 'resistance_thermique', label: 'Résistance thermique R (m².K/W) ≥ 7', type: 'number', required: true, min: 7, step: 0.1 },
      { key: 'marque_isolant', label: "Marque de l'isolant", type: 'text', required: true },
      { key: 'reference_isolant', label: "Référence de l'isolant", type: 'text', required: true },
      { key: 'epaisseur_mm', label: 'Épaisseur (mm)', type: 'number', required: true, min: 1 },
    ],
    compute: (d) => {
      const zone = d.zone_climatique
      const s = Number(d.surface_isolee_m2) || 0
      if (!zone || !s) return null
      const coefs = { H1: 1600, H2: 1300, H3: 900 } // kWh cumac / m² (maison indiv., indicatif)
      return { kwh_cumac: Math.round((coefs[zone] || 0) * s) }
    },
  },

  'BAR-TH-143': {
    code: 'BAR-TH-143',
    label: 'Système solaire combiné',
    secteur: 'residentiel',
    description: "Installation d'un système solaire combiné (chauffage + eau chaude sanitaire).",
    fields: [
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select', options: ZONES_CLIMATIQUES, required: true },
      { key: 'surface_capteurs_m2', label: 'Surface capteurs (m²)', type: 'number', required: true, step: 0.1 },
      { key: 'productivite_kwh_m2_an', label: 'Productivité (kWh/m²/an)', type: 'number', required: true },
      { key: 'marque', label: 'Marque', type: 'text', required: true },
      { key: 'reference', label: 'Référence', type: 'text', required: true },
      { key: 'certification', label: 'Certification (Solar Keymark, CSTBat...)', type: 'text', required: true },
    ],
    compute: (d) => {
      const s = Number(d.surface_capteurs_m2) || 0
      const p = Number(d.productivite_kwh_m2_an) || 0
      if (!s || !p) return null
      // Approximation : cumac ≈ productivité × surface × durée_vie (20 ans)
      return { kwh_cumac: Math.round(s * p * 20) }
    },
  },

  'BAR-EQ-117': {
    code: 'BAR-EQ-117',
    label: 'Borne de recharge IRVE résidentielle',
    secteur: 'residentiel',
    description: "Installation d'une borne de recharge pour véhicule électrique en résidentiel.",
    fields: [
      { key: 'nb_bornes', label: 'Nombre de bornes', type: 'number', required: true, min: 1 },
      { key: 'puissance_kw', label: 'Puissance par borne (kW)', type: 'number', required: true, step: 0.1 },
      { key: 'marque', label: 'Marque', type: 'text', required: true },
      { key: 'reference', label: 'Référence', type: 'text', required: true },
      { key: 'installateur_irve', label: 'Installateur qualifié IRVE', type: 'checkbox' },
      { key: 'pilotage_energetique', label: 'Pilotage énergétique', type: 'checkbox' },
    ],
    compute: (d) => {
      // Forfait indicatif par borne
      const nb = Number(d.nb_bornes) || 0
      return { kwh_cumac: nb * 7400 }
    },
  },
}

// ==========================================================
// Helpers
// ==========================================================
export function getFiche(code) {
  return FICHES[code] || null
}

export function listFiches() {
  return Object.values(FICHES)
}

export function computeCumac(code, data) {
  const f = getFiche(code)
  if (!f || !f.compute) return null
  return f.compute(data || {})
}

// Délégataires CEE majeurs en France
export const DELEGATAIRES_CEE = [
  'TotalEnergies',
  'EDF',
  'Engie',
  'Geo France Finance',
  'Hellio',
  'Leclerc',
  'Capital Energy',
  'Vol-V',
  'Economie d\'Énergie (EDE)',
  'Sonergia',
  'Effy',
  'GreenYellow',
  'BHC Energy',
  'Certinergy',
  'Autre',
]

// ==========================================================
// Alertes de validité (12 mois après date de facture)
// ==========================================================
export function computeExpiryStatus(dateFacture) {
  if (!dateFacture) return { status: 'unknown', daysLeft: null, expiryDate: null }
  const facture = new Date(dateFacture)
  const expiry = new Date(facture)
  expiry.setMonth(expiry.getMonth() + CEE_VALIDITY_MONTHS)
  const now = new Date()
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))

  let status = 'ok'
  if (daysLeft < 0) status = 'expired'
  else if (daysLeft <= 30) status = 'critical'
  else if (daysLeft <= 90) status = 'warning'

  return { status, daysLeft, expiryDate: expiry }
}

export function formatExpiryLabel(dateFacture) {
  const { status, daysLeft } = computeExpiryStatus(dateFacture)
  if (status === 'unknown') return null
  if (status === 'expired') return `Expiré depuis ${Math.abs(daysLeft)}j`
  if (status === 'critical') return `Expire dans ${daysLeft}j`
  if (status === 'warning') return `Expire dans ${daysLeft}j`
  return `Valide ${daysLeft}j`
}
